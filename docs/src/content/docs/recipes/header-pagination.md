---
title: Backends that paginate with headers
description: WordPress, Ransack (Pagy or Kaminari) and PostgREST report their page counts in HTTP headers. Read them with qubeeHttpResource() or HttpClient, and expose them to the browser over CORS.
---

Most backends put the page count in the response body. A few put it in HTTP headers instead and send a bare array as the body: WordPress (`X-WP-Total`, `X-WP-TotalPages`, `Link`), Rails apps that filter with Ransack and paginate with Pagy or Kaminari, and PostgREST (and Supabase, which runs it), whose `Content-Range` answers a `Range` request header. The drivers read those headers for you. On the Angular side there is almost nothing to write. The one thing that goes wrong is on the server: unless the API lists those headers in `Access-Control-Expose-Headers`, the browser hides them from your code on a cross-origin request.

## The problem

A WordPress API on another origin answers page 2 of a ten-per-page list correctly:

```http
GET https://example.com/wp-json/wp/v2/posts?page=2&per_page=10

HTTP/1.1 200 OK
X-WP-Total: 34
X-WP-TotalPages: 4
Link: <https://example.com/wp-json/wp/v2/posts?page=1&per_page=10>; rel="prev", <https://example.com/wp-json/wp/v2/posts?page=3&per_page=10>; rel="next"
```

The browser's Network panel shows all three headers. Whether your code sees them depends on CORS. Cross-origin, a script can read only the CORS-safelisted response headers (`Cache-Control`, `Content-Language`, `Content-Length`, `Content-Type`, `Expires`, `Last-Modified`, `Pragma`) and whatever the server names in `Access-Control-Expose-Headers`. The parsed page then differs:

| Headers the browser exposes | `page` | `lastPage` | `total` | `getPageRange()` |
| --- | --- | --- | --- | --- |
| All three | 2 | 4 | 34 | 11–20 of 34 |
| `X-WP-Total` and `X-WP-TotalPages`, not `Link` | 1 | 4 | 34 | 25–34 of 34 |
| None | 1 | `undefined` | `undefined` | 1–10 |

Nothing throws. The drivers tolerate missing headers and work out what they can, so a page that is missing the headers looks like a backend that doesn't count, or like the wrong page. Pagination controls then show no page numbers, or a "Next" button that stops working.

:::caution
`ng serve` with a proxy configuration makes the API same-origin, and every header is readable. The same build deployed against the real, cross-origin API loses them. Check the headers against the origin you deploy to.
:::

## The solution

### 1. Declare the list

The driver knows where its numbers are. Declare the list as you would for any backend:

```typescript title="lists.ts"
import {
  POSTGREST_DRIVER,
  PaginationModeEnum,
  RANSACK_DRIVER,
  WORDPRESS_DRIVER,
  defineList,
  integerParam
} from '@qubeejs/angular';

// WordPress: X-WP-Total, X-WP-TotalPages and Link
export const postList = defineList({
  apply: (builder) => {
    builder.setLimit(10);
  },
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: { baseUrl: 'https://example.com/wp-json/wp/v2', driver: WORDPRESS_DRIVER },
  resource: 'posts'
});

// Rails + Ransack, paginated by Pagy: current-page, total-pages, page-limit, total-count
export const pagyList = defineList({
  apply: (builder) => {
    builder.setLimit(20);
  },
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: { baseUrl: 'https://api.example.com', driver: RANSACK_DRIVER },
  resource: 'articles'
});

// Rails + Ransack, paginated by Kaminari and api-pagination: Total, Per-Page, Link
export const kaminariList = defineList({
  apply: (builder) => {
    builder.setLimit(20);
  },
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: {
    baseUrl: 'https://api.example.com',
    driver: RANSACK_DRIVER,
    request: { limit: 'per_page' }
  },
  resource: 'articles'
});

// PostgREST / Supabase in RANGE mode: Range out, Content-Range back
export const rangeList = defineList({
  apply: (builder) => {
    builder.setLimit(20);
  },
  params: { page: integerParam('page', { default: 1, min: 1 }) },
  qubee: {
    baseUrl: 'https://api.example.com',
    driver: POSTGREST_DRIVER,
    pagination: PaginationModeEnum.RANGE
  },
  resource: 'articles'
});
```

What each one puts on the wire for `?page=2`:

| List | Request | Read from the response |
| --- | --- | --- |
| `postList` | `…/posts?page=2&per_page=10` | `X-WP-Total`, `X-WP-TotalPages`, `Link` |
| `pagyList` | `…/articles?page=2&limit=20` | `current-page`, `total-pages`, `page-limit`, `total-count`, `link` |
| `kaminariList` | `…/articles?page=2&per_page=20` | `Total`, `Per-Page`, `Link` (and `Page`, if api-pagination sends it) |
| `rangeList` | `…/articles` with `Range-Unit: items` and `Range: 20-39` | `Content-Range`: `0-19/34` is rows 1–20 of 34 |

Pagy's names are the ones its `headers_hash` sends. Kaminari needs `request: { limit: 'per_page' }`, since its page size parameter is `per_page`; the Ransack driver reads api-pagination's header names when Pagy's are absent, with no configuration.

### 2. Fetch it with `qubeeHttpResource()`

`qubeeHttpResource()` sends the list's request headers and hands the response headers to the driver, so a header-driven list looks like any other:

```typescript title="posts.component.ts"
import { Component } from '@angular/core';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { postList } from './lists';

type Post = { id: number; title: { rendered: string } };

@Component({
  selector: 'app-posts',
  template: `
    @if (posts.value(); as page) {
      <ul>
        @for (post of page.data; track post.id) {
          <li [innerHTML]="post.title.rendered"></li>
        }
      </ul>

      <p>Page {{ list.state().page }} of {{ page.lastPage ?? '…' }} · {{ page.total ?? '?' }} posts</p>
    }
  `
})
export class PostsComponent {
  protected readonly list = injectQubeeList(postList);
  protected readonly posts = qubeeHttpResource<Post>(this.list.request);
}
```

With the headers exposed this renders "Page 2 of 4 · 34 posts". The current page comes from `list.state()`, the page that was asked for, rather than from the parsed response.

PostgREST counts rows only when asked. Send `Prefer: count=exact` through `init`; the list adds `Range` and `Range-Unit` itself:

```typescript title="range-articles.component.ts"
import { Component } from '@angular/core';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { rangeList } from './lists';

type Article = { id: number; title: string };

@Component({
  selector: 'app-range-articles',
  template: `
    @for (article of articles.value()?.data; track article.id) {
      <p>{{ article.title }}</p>
    }
  `
})
export class RangeArticlesComponent {
  protected readonly list = injectQubeeList(rangeList);

  // The list sends Range and Range-Unit; Prefer asks PostgREST to count the rows.
  protected readonly articles = qubeeHttpResource<Article>(this.list.request, {
    init: { headers: { Prefer: 'count=exact' } }
  });
}
```

The first page goes out as `GET …/articles` with `Prefer: count=exact`, `Range-Unit: items` and `Range: 0-19`. A `Content-Range: 0-19/34` answer parses as page 1 of 2, 34 rows. Without `Prefer: count=exact`, PostgREST answers `0-19/*`, and `total` and `lastPage` stay `undefined`. On a clash, the list's own headers win over `init`, since paging depends on them.

The bootstrap is the usual one for a list: `provideRouter()`, `provideQubeeRouterAdapter()` and `provideHttpClient()`.

### 3. Expose the headers on the server

List every header the driver reads in `Access-Control-Expose-Headers`, on the API's responses:

| Backend | `Access-Control-Expose-Headers` |
| --- | --- |
| WordPress | `X-WP-Total, X-WP-TotalPages, Link` |
| Rails + Pagy | `current-page, total-pages, page-limit, total-count, link` |
| Rails + Kaminari / api-pagination | `Total, Per-Page, Link` (and `Page` if you turn it on) |
| PostgREST | `Content-Range` |

WordPress's REST server sends that list by default (the `rest_exposed_cors_headers` filter changes it), so check that no proxy or CDN in front of it strips the header. In Rails, rack-cors takes the list as `expose`:

```ruby title="config/initializers/cors.rb"
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://app.example.com'
    resource '*',
      headers: :any,
      methods: [:get],
      expose: %w[current-page total-pages page-limit total-count link]
  end
end
```

PostgREST in `RANGE` mode also *sends* headers that are not CORS-safelisted (`Range` with an item range, `Range-Unit`, `Prefer`), so the browser makes a preflight request first, and the server must allow them in `Access-Control-Allow-Headers`.

To check from the application which headers made it through, read them off the underlying resource. `keys()` lists only what the browser exposed:

```typescript title="diagnose.ts"
import { Component, effect } from '@angular/core';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { postList } from './lists';

type Post = { id: number; title: { rendered: string } };

@Component({ selector: 'app-posts-diagnose', template: `` })
export class PostsDiagnoseComponent {
  protected readonly list = injectQubeeList(postList);
  protected readonly posts = qubeeHttpResource<Post>(this.list.request);

  constructor() {
    effect(() => {
      const headers = this.posts.resource.headers();

      if (headers && !headers.has('X-WP-TotalPages')) {
        console.warn('X-WP-TotalPages is hidden: list it in Access-Control-Expose-Headers', headers.keys());
      }
    });
  }
}
```

## Why it works

- **The request carries its own headers.** A list's `request` is `{ uri, headers, paginate }`. `headers` is `null` for every driver except PostgREST in `RANGE` mode, where it holds `Range-Unit` and `Range` for the page in the URL. `qubeeHttpResource()` merges them over `init.headers` and sends them.
- **The response headers reach the driver.** `qubeeHttpResource()` passes the response's `HttpHeaders` to `request.paginate(body, headers)`, which hands them to the list's response strategy. Body-only drivers ignore them.
- **Casing doesn't matter, through `HttpHeaders`.** Its `get()` is case-insensitive, so `X-WP-Total` and `x-wp-total` read the same. A plain object, in a test for instance, must use the casing the driver looks up: `X-WP-Total` for WordPress, `Content-Range` for PostgREST, lower case for Ransack.
- **Missing headers degrade, never throw.** WordPress works out the current page from the `Link` header's `prev` and `next` URLs, and falls back to page 1 without them. Ransack falls back from Pagy's names to api-pagination's, then derives the last page from the `last` link or from total ÷ page size. PostgREST reads offset, end and total from `Content-Range`, with `*` meaning no count. That tolerance is why hidden headers show up as wrong numbers rather than errors.
- **One fetch per page.** `Range` changes with the page, so `request` changes once per navigation, and `qubeeHttpResource()` fetches once and aborts a stale request.

## Variations

### Angular 17 to 19.1: `HttpClient` and `QubeePaginator`

Without `httpResource()`, the query builder and `HttpClient` do the same job. Ask for the full response with `observe: 'response'`, spread `paginationHeaders()` into the request, and pass the body and the headers to `QubeePaginator.paginate()`:

```typescript title="article-client.service.ts"
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaginatedCollection, QubeePaginator, QubeeQueryBuilder } from '@qubeejs/angular';

export type Article = { id: number; title: string };

@Injectable()
export class ArticleClient {
  private readonly _http = inject(HttpClient);
  private readonly _paginator = inject(QubeePaginator);
  private readonly _qb = inject(QubeeQueryBuilder);

  private readonly _page = signal<PaginatedCollection<Article> | undefined>(undefined);
  public readonly page = this._page.asReadonly();

  public load(): void {
    this._qb.setResource('articles').setLimit(20);
    this._fetch();
  }

  public next(): void {
    this._qb.nextPage();
    this._fetch();
  }

  public previous(): void {
    this._qb.previousPage();
    this._fetch();
  }

  private _fetch(): void {
    const headers = {
      Prefer: 'count=exact',                     // ask PostgREST for the total
      ...(this._qb.paginationHeaders() ?? {})    // Range and Range-Unit in RANGE mode
    };

    this._http
      .get<Article[]>(this._qb.generateUri(), { headers, observe: 'response' })
      .subscribe((response) => {
        // The headers are what carry the page: pass them along with the body.
        this._page.set(this._paginator.paginate<Article>(response.body ?? [], response.headers));
      });
  }
}
```

```typescript title="article-list.component.ts"
import { Component, OnInit, inject } from '@angular/core';
import { QubeeQueryBuilder, provideQubeeInstance } from '@qubeejs/angular';

import { ArticleClient } from './article-client.service';

@Component({
  selector: 'app-article-list',
  providers: [...provideQubeeInstance(), ArticleClient],
  template: `
    @if (client.page(); as page) {
      @for (article of page.data; track article.id) {
        <p>{{ article.title }}</p>
      }

      <button type="button" [disabled]="qb.isFirstPage()" (click)="client.previous()">Previous</button>
      <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
      <button type="button" [disabled]="qb.isLastPage()" (click)="client.next()">Next</button>
    }
  `
})
export class ArticleListComponent implements OnInit {
  protected readonly client = inject(ArticleClient);
  protected readonly qb = inject(QubeeQueryBuilder);

  public ngOnInit(): void {
    this.client.load();
  }
}
```

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { POSTGREST_DRIVER, PaginationModeEnum, provideQubee } from '@qubeejs/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideQubee({
      baseUrl: 'https://api.example.com',
      driver: POSTGREST_DRIVER,
      pagination: PaginationModeEnum.RANGE
    })
  ]
};
```

`paginationHeaders()` is a signal holding the driver's request headers, or `null` for every driver that doesn't page over headers, so the spread is safe whatever the driver. `paginate()` syncs the parsed page and last page into the builder, which is how `totalPages()` and `isLastPage()` learn the bounds: the first response above renders "Page 1 of 2". For WordPress or Ransack, drop `Prefer` and keep the rest; the `observe: 'response'` and the second argument to `paginate()` are what matter.

A **list** on Angular 17 to 19.1 follows the same idea: send `request.headers`, and pass `response.headers` to `request.paginate()`, as in [A list on Angular 17 to 19.1](/guide/fetching-data/#a-list-on-angular-17-to-191).

## Related

- [Fetching data](/guide/fetching-data/#fetching-a-list): `qubeeHttpResource()` and its `init` option
- [Fetching data: PostgREST and Supabase](/guide/fetching-data/#postgrest-and-supabase): the same with `httpResource()` and the query builder
- [Pagination](/guide/pagination/#header-based-pagination): `paginationHeaders()` and `paginate(body, headers)`
- [Pagination controls](/recipes/pagination-controls/): the bar these numbers feed
- [Header-based pagination ↗](https://qubeejs.andreatantimonaco.me/guide/pagination/#header-based-pagination): the core's side of it
- Driver references ↗: [WordPress](https://qubeejs.andreatantimonaco.me/drivers/reference/wordpress/), [Ransack](https://qubeejs.andreatantimonaco.me/drivers/reference/ransack/), [PostgREST](https://qubeejs.andreatantimonaco.me/drivers/reference/postgrest/)
