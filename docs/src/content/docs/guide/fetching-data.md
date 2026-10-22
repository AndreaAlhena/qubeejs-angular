---
title: Fetching data
description: Fetch a list's page with qubeeHttpResource(), or bind httpResource() to the query builder's uri signal.
---

The adapter builds the request and parses the response; the HTTP call stays yours, through `HttpClient` and your interceptors. There are two ways in, depending on where the query lives:

- **A list** declared with `defineList()` — fetch its `request` with [`qubeeHttpResource()`](#fetching-a-list), from `@qubeejs/angular/http`.
- **A `QubeeQueryBuilder`** you drive with method calls — bind `httpResource()` to its [`uri` signal](#with-the-query-builder).

`httpResource()`, and so `qubeeHttpResource()`, ships with Angular 19.2. On Angular 17 to 19.1, fetch with `HttpClient` in an effect or a callback — both sections show how. Every shape needs `provideHttpClient()` in your bootstrap providers.

## Fetching a list

`qubeeHttpResource()` fetches the page a list's `request` asks for and parses it with the list's own paginator:

```typescript
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

protected readonly list = injectQubeeList(articleList);
protected readonly articles = qubeeHttpResource<Article>(this.list.request);
```

```html
@for (article of articles.value()?.data; track article.id) {
  <p>{{ article.title }}</p>
}
```

It is built on Angular's `httpResource()`, so it goes through `HttpClient` and your interceptors — authentication included — and needs Angular 19.2. It lives in its own entry point so that applications on older versions never load it.

- It fetches again only when `request` changes: once per navigation, never per keystroke. A request made stale by a newer one is aborted.
- It sends the request's headers — PostgREST's `Range` in `RANGE` mode — and hands the response headers to `paginate()`, so PostgREST, WordPress and Ransack read their totals from headers with no extra code.
- The previous page stays on screen while the next one loads; pass `keepPreviousData: false` to clear it instead.
- A `null` request — a list whose [input](/guide/lists/#lists-that-need-more-than-the-url) is not ready — fetches nothing.

| Member | Type | What it is |
| --- | --- | --- |
| `value` | `Signal<PaginatedCollection<T> \| undefined>` | The parsed page: rows in `data`, plus `page`, `lastPage`, `total`, `from`, `to`… `undefined` before the first answer, after a failure, and while the request is `null` |
| `isLoading` | `Signal<boolean>` | A request is in flight |
| `error` | `Signal<unknown>` | An `HttpErrorResponse` for a status that is not ok, else what the parser threw |
| `reload()` | `() => boolean` | Fetch the current request again; returns whether a reload started |
| `resource` | `HttpResourceRef<RawResponse \| undefined>` | The underlying `httpResource()`: `statusCode`, `headers`, `progress`, the raw body |

Options go in the second argument:

```typescript
qubeeHttpResource<Article>(this.list.request, {
  init: { headers: { Prefer: 'count=exact' }, withCredentials: true }, // added to every request
  keepPreviousData: false,
  injector: this._injector                                           // outside an injection context
});
```

`init` takes the `httpResource()` request options except the URL, method, body and params. The list's own headers win over yours on a clash, since paging depends on them.

### By hand

`qubeeHttpResource()` is a thin layer. When you need something it does not do, the same thing by hand is:

```typescript
protected readonly response = httpResource<RawResponse>(() => {
  const { headers, uri } = this.list.request();

  return { headers: headers ?? undefined, url: uri };
});

protected readonly page = computed(() =>
  this.response.hasValue()
    ? this.list.request().paginate<Article>(this.response.value(), this.response.headers())
    : undefined
);
```

…minus keeping the previous page while the next one loads, which `httpResource()` does not do. Unlike `QubeePaginator.paginate()`, a list request's `paginate()` writes no signals, so it can run inside `computed()` — `qubeeHttpResource()` does exactly that.

### A list on Angular 17 to 19.1

Before `httpResource()`, fetch in an `effect()` that reads `request()`:

```typescript
export class ArticlesComponent {
  private readonly _http = inject(HttpClient);

  protected readonly list = injectQubeeList(articleList);
  protected readonly page = signal<PaginatedCollection<Article> | undefined>(undefined);

  constructor() {
    effect((onCleanup) => {
      const request = this.list.request();
      const subscription = this._http
        .get<RawResponse>(request.uri, { headers: request.headers ?? {}, observe: 'response' })
        .subscribe((response) => this.page.set(request.paginate<Article>(response.body ?? [], response.headers)));

      onCleanup(() => subscription.unsubscribe());
    });
  }
}
```

`request` changes once per navigation, so the effect runs once per page; unsubscribing on cleanup cancels a request a newer navigation has made stale.

## With the query builder

When the query lives in a `QubeeQueryBuilder`, pair **`httpResource()` with `provideQubeeInstance()`**: each feature component gets its own builder, the resource derives its request from that builder's `uri` signal, and any mutation — filter, sort, page — fetches again on its own. The example uses the Spatie driver; every driver works the same way, and the header-driven ones differ only in [passing the response headers](#postgrest-and-supabase).

```typescript title="user-client.service.ts"
import { Injectable, Signal, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { PaginatedCollection, QubeePaginator, QubeeQueryBuilder, RawResponse, SortEnum } from '@qubeejs/angular';

export type User = {
  id: number;
  email: string;
  name: string;
};

@Injectable()
export class UserClient {
  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _paginator = inject(QubeePaginator);

  /**
   * Derived from the uri signal: idle until a resource is set, then fetches
   * again after every mutation. No trigger, no subscription.
   */
  private readonly _response = httpResource<RawResponse>(() => this._qb.uri());

  private readonly _page = signal<PaginatedCollection<User> | undefined>(undefined);

  /** The current page, parsed and typed; `undefined` until the first response */
  public readonly page: Signal<PaginatedCollection<User> | undefined> = this._page.asReadonly();

  public readonly isLoading: Signal<boolean> = this._response.isLoading;

  constructor() {
    // Parsing syncs page and lastPage back into the store — a write, so it
    // lives in an effect, not a computed.
    effect(() => {
      if (this._response.hasValue()) {
        this._page.set(this._paginator.paginate<User>(this._response.value()));
      }
    });
  }

  /** Setting the resource is what wakes the resource up. */
  public list(): void {
    this._qb.setResource('users').addSort('created_at', SortEnum.DESC);
  }

  /** Filters reset the page to 1. */
  public search(term: string): void {
    this._qb.setResource('users').addFilter('name', term);
  }

  public next(): void {
    this._qb.nextPage();
  }

  public previous(): void {
    this._qb.previousPage();
  }
}
```

What happens:

1. **`uri()`** is `undefined` until `setResource()` runs, and `httpResource()` treats `undefined` as idle — nothing is fetched before `list()`.
2. **`setResource()`, `addFilter()`, `nextPage()`** are synchronous writes to the store. Each changes `uri()`, and the resource fetches again; a request for a stale URI is cancelled.
3. **`paginate<User>(body)`** parses the body into a `PaginatedCollection<User>` and syncs `page` and `lastPage` back into the store, so `totalPages()`, `isLastPage()` and the rest reflect the server's bounds.
4. That sync does **not** fetch again: the URI is unchanged, and the store's signal only notifies when the state actually differs.

Scope the client and a fresh builder to the component, so each instance owns its query and its resource:

```typescript title="user-list.component.ts"
import { Component, OnInit, inject } from '@angular/core';
import { QubeeQueryBuilder, provideQubeeInstance } from '@qubeejs/angular';

import { UserClient } from './user-client.service';

@Component({
  selector: 'app-user-list',
  providers: [...provideQubeeInstance(), UserClient],
  template: `
    @if (client.page(); as page) {
      <ul>
        @for (u of page.data; track u.id) {
          <li>{{ u.name }} — {{ u.email }}</li>
        }
      </ul>

      <button [disabled]="qb.isFirstPage()" (click)="client.previous()">Prev</button>
      <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() ?? '…' }}</span>
      <button [disabled]="qb.isLastPage()" (click)="client.next()">Next</button>
    } @else if (client.isLoading()) {
      <p>Loading…</p>
    }
  `
})
export class UserListComponent implements OnInit {
  protected readonly client = inject(UserClient);
  protected readonly qb = inject(QubeeQueryBuilder);

  public ngOnInit(): void {
    this.client.list();
  }
}
```

### Why scope per component

The reactive pipeline only works cleanly when **the client owns its own `QubeeQueryBuilder`**. Were `UserClient` `providedIn: 'root'` and sharing the app-wide builder, every other consumer's `setResource()` would change the same `uri` signal, and the user list would fetch product URIs, invoice URIs, anything. `provideQubeeInstance()` gives each component a private builder, store and paginator. A root-scoped client gets the same isolation from [`createQubeeInstance()`](/guide/per-component-instances/#isolated-state-in-a-root-scoped-service).

### PostgREST and Supabase

PostgREST returns a bare array and reports the total in the `Content-Range` response header. Ask for it with `Prefer: count=exact`, spread `paginationHeaders()` for `RANGE` mode, and hand the response headers to `paginate()`:

```typescript
private readonly _response = httpResource<User[]>(() => {
  const url = this._qb.uri();

  if (url === undefined) {
    return undefined;                              // idle until a resource is set
  }

  return {
    url,
    headers: {
      Prefer: 'count=exact',                       // ask PostgREST for the total
      ...(this._qb.paginationHeaders() ?? {})      // Range headers in RANGE mode, null otherwise
    }
  };
});

constructor() {
  effect(() => {
    if (this._response.hasValue()) {
      this._page.set(this._paginator.paginate<User>(this._response.value(), this._response.headers()));
    }
  });
}
```

`paginationHeaders()` notifies only when the header values change, so the sync performed by `paginate()` never triggers a second fetch.

### WordPress

The same shape: a bare array, with the totals in `X-WP-Total` and `X-WP-TotalPages`, which WordPress always sends:

```typescript
private readonly _response = httpResource<Post[]>(() => this._qb.uri());

constructor() {
  effect(() => {
    if (this._response.hasValue()) {
      this._page.set(this._paginator.paginate<Post>(this._response.value(), this._response.headers()));
    }
  });
}
```

## With HttpClient (Angular 17 to 19.1)

Without `httpResource()`, fetch imperatively and set the signal from the callback. `HttpClient` returns an Observable, so this is the one place `subscribe()` appears — in your code, never in the library:

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaginatedCollection, QubeePaginator, QubeeQueryBuilder, RawResponse, SortEnum } from '@qubeejs/angular';

@Injectable()
export class UserClient {
  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _paginator = inject(QubeePaginator);
  private readonly _http = inject(HttpClient);

  private readonly _page = signal<PaginatedCollection<User> | undefined>(undefined);
  public readonly page = this._page.asReadonly();

  public list(): void {
    this._qb.setResource('users').addSort('created_at', SortEnum.DESC);
    this._fetch();
  }

  public next(): void {
    this._qb.nextPage();
    this._fetch();
  }

  private _fetch(): void {
    this._http.get<RawResponse>(this._qb.generateUri()).subscribe((body) => {
      this._page.set(this._paginator.paginate<User>(body));
    });
  }
}
```

Each navigation calls `_fetch()` explicitly; there is no long-lived stream to leak, and a root-scoped client is safe here because nothing reacts to the shared `uri` signal on its own. For PostgREST, WordPress and Ransack, request `{ observe: 'response' }` and pass `response.headers` as the second argument of `paginate()`.
