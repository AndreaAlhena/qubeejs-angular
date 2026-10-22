---
title: Pagination controls
description: A page-number bar with gaps, a "21–34 of 34" label and previous/next buttons, driven by a list in the URL with getPageWindow() and getPageRange().
---

A list page needs more than a "Next" button: a bar of page numbers that folds long runs into gaps, a label that says which rows are on screen, and previous and next buttons that know when to stop. Two helpers from the core do the arithmetic: `getPageWindow()` picks the page numbers and `getPageRange()` gives the numbers behind "21–34 of 34". The markup stays yours. This recipe wires them to a list kept in the URL with `injectQubeeList()`, fetched with `qubeeHttpResource()`, including the case where the backend never says how many pages there are.

## The problem

The obvious version renders a button for every page and works out the label from the page number:

```typescript
// One button per page: 117 of them for 2,340 rows.
protected readonly pages = computed(() =>
  Array.from({ length: this.articles.value()?.lastPage ?? 0 }, (_, index) => index + 1)
);

// Assumes every page is full: "21–40 of 34" on the last one.
protected readonly label = computed(() => {
  const page = this.articles.value();
  const from = (this.list.state().page - 1) * 20 + 1;

  return page ? `${from}–${from + 19} of ${page.total}` : '';
});
```

On page 2 of 34 rows, twenty per page, that label reads **21–40 of 34**. The bar grows with the data set, so it wraps or overflows, and it shifts under the pointer as the user pages. It also hard-codes the page size and assumes the backend counts its rows, which not every backend does.

## The solution

Declare the list once. The examples use the Spatie driver; the helpers read the parsed page, so they work the same with any driver:

```typescript title="article-list.ts"
import { SPATIE_DRIVER, defineList, integerParam } from '@qubeejs/angular';

export const articleList = defineList({
  apply: (builder) => {
    builder.setLimit(20);
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 })
  },
  qubee: { baseUrl: 'https://api.example.com', driver: SPATIE_DRIVER },
  resource: 'articles'
});
```

The component derives the bar, the label and the button states from two sources: the page in the URL (`list.state()`) and the page the server returned (`articles.value()`):

```typescript title="articles.component.ts"
import { Component, computed } from '@angular/core';
import { getPageRange, getPageWindow, injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { articleList } from './article-list';

type Article = { id: number; title: string };

@Component({
  selector: 'app-articles',
  template: `
    <ul [attr.aria-busy]="articles.isLoading()">
      @for (article of articles.value()?.data; track article.id) {
        <li>{{ article.title }}</li>
      }
    </ul>

    @if (pageRange(); as range) {
      <p>
        @if (range.to === 0) {
          No articles
        } @else if (range.total === null) {
          {{ range.from }}–{{ range.to }}
        } @else {
          {{ range.from }}–{{ range.to }} of {{ range.total }}
        }
      </p>
    }

    <nav aria-label="Pagination">
      <button type="button" [disabled]="!hasPrevious()" (click)="list.setPage(list.state().page - 1)">
        Previous
      </button>

      @for (item of pages(); track $index) {
        @if (item === 'gap') {
          <span aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            [attr.aria-current]="item === list.state().page ? 'page' : null"
            (click)="list.setPage(item)"
          >
            {{ item }}
          </button>
        }
      }

      <button type="button" [disabled]="!hasNext()" (click)="list.setPage(list.state().page + 1)">
        Next
      </button>
    </nav>
  `
})
export class ArticlesComponent {
  protected readonly list = injectQubeeList(articleList);
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  /** Page numbers and gaps, around the page in the URL; none until the last page is known */
  protected readonly pages = computed(() => {
    const lastPage = this.articles.value()?.lastPage;

    return lastPage === undefined ? [] : getPageWindow(this.list.state().page, lastPage);
  });

  /** The numbers behind "21–34 of 34" for the page on screen */
  protected readonly pageRange = computed(() => {
    const page = this.articles.value();

    return page ? getPageRange(page) : undefined;
  });

  protected readonly hasPrevious = computed(() => this.list.state().page > 1);

  protected readonly hasNext = computed(() => {
    const page = this.articles.value();

    if (!page) {
      return false; // nothing on screen yet
    }

    if (page.lastPage !== undefined) {
      return this.list.state().page < page.lastPage;
    }

    // No count: only the response on screen knows whether another page follows.
    return !this.articles.isLoading() && page.nextPageUrl !== undefined;
  });
}
```

Provide the router adapter and `HttpClient`:

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

import { ArticlesComponent } from './articles.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([{ path: 'articles', component: ArticlesComponent }]),
    provideQubeeRouterAdapter(),
    provideHttpClient()
  ]
};
```

`qubeeHttpResource()` needs Angular 19.2. On Angular 17 to 19.1, fetch the list's `request` in an `effect()` as in [A list on Angular 17 to 19.1](/guide/fetching-data/#a-list-on-angular-17-to-191); the computed signals above read the same `PaginatedCollection` either way.

### What it renders

| Situation | Label | Bar (`[n]` is `aria-current="page"`) |
| --- | --- | --- |
| `?page=2` before the first response | none | Previous · Next (disabled) |
| Page 2 of 2, 34 rows | 21–34 of 34 | Previous · 1 · [2] · Next (disabled) |
| Page 5 of 12 | 81–100 of 234 | Previous · 1 · … · 4 · [5] · 6 · … · 12 · Next |
| Right after a click on 6 | 81–100 of 234, until page 6 arrives | Previous · 1 · … · 5 · [6] · 7 · … · 12 · Next |
| `?page=99` of 2, edited by hand | No articles | Previous · 1 · 2 · Next (disabled) |

### While the last page is unknown

Some backends don't count. Laravel's `simplePaginate()`, for one, sends `current_page`, `from`, `to` and `next_page_url` but no `last_page` or `total`. The parsed page then has `lastPage` and `total` set to `undefined`, and the component falls back to previous and next:

| Situation | Label | Bar |
| --- | --- | --- |
| Page 2, a `next_page_url` present | 21–40 | Previous · Next |
| Right after a click on Next, while page 3 loads | 21–40 | Previous · Next (disabled) |
| Page 3, `next_page_url: null` | 41–43 | Previous · Next (disabled) |

`getPageRange()` reports `total: null` when the backend does not count, and the template drops the "of …" part.

:::note
Don't hand `getPageWindow()` an unknown last page. It never throws: a last page that is `undefined`, `0` or `NaN` is treated as `1`, so the bar would be a lone `1` even on page 7. Without a count, offer previous and next instead.
:::

## Why it works

- **The window keeps a constant length.** `getPageWindow(page, lastPage)` returns page numbers with `'gap'` where a run is folded: `getPageWindow(5, 12)` is `[1, 'gap', 4, 5, 6, 'gap', 12]`. It always has `2 × boundaries + 2 × siblings + 3` places (seven by default), or every page when there are fewer, so the buttons don't move as the user pages. A gap never stands for a single page; that page's number is shown instead. A page outside `1`–`lastPage` is clamped, which is why `?page=99` still shows a way back.
- **The current page comes from the URL, the last page from the server.** `list.state().page` changes the moment `setPage()` is called, so the bar re-centres on the click. `lastPage` is only known from a response, and `qubeeHttpResource()` keeps the previous page on screen while the next one loads, so the bar doesn't disappear between pages. The rows and the label belong to the page on screen, so they change when the new page arrives.
- **The range follows the backend.** `getPageRange()` uses the backend's own `from` and `to` when the driver reports them, and works them out from the page, the page size and the rows otherwise. An empty page is `{ from: 0, to: 0, total }`, which the template shows as "No articles".
- **`setPage()` is a navigation.** Each click pushes one history entry, so Back returns to the previous page, and changes `request` once, so `qubeeHttpResource()` fetches once and aborts a request a newer click has made stale.
- **The gap is hidden from screen readers.** The `…` is `aria-hidden`, the bar is a labelled `<nav>`, and the current page is marked with `aria-current="page"`.

## Variations

### Links instead of buttons

Page numbers as links can be middle-clicked, opened in a new tab and followed by crawlers. `href()` builds the URL for a page, keeping every other parameter, and `routerLink` takes a `UrlTree` from Angular 18.1:

```typescript
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { getPageWindow, injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { articleList } from './article-list';

type Article = { id: number; title: string };

@Component({
  selector: 'app-article-links',
  imports: [RouterLink],
  template: `
    <nav aria-label="Pagination">
      @for (item of pages(); track $index) {
        @if (item === 'gap') {
          <span aria-hidden="true">…</span>
        } @else {
          <a
            [routerLink]="router.parseUrl(list.href({ page: item }))"
            [attr.aria-current]="list.href({ page: item }) === list.href() ? 'page' : null"
          >
            {{ item }}
          </a>
        }
      }
    </nav>
  `
})
export class ArticleLinksComponent {
  protected readonly router = inject(Router);
  protected readonly list = injectQubeeList(articleList);
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  protected readonly pages = computed(() => {
    const lastPage = this.articles.value()?.lastPage;

    return lastPage === undefined
      ? []
      : getPageWindow(this.list.state().page, lastPage, { boundaries: 2, siblings: 2 });
  });
}
```

On Angular 17.0 to 18.0, pass the query on its own, as shown in [Links](/guide/lists/#links). Compare `list.href(changes)` with `list.href()` to find the active link, never raw query strings: page 1 is the default, so its link carries no `page` at all.

### A wider window

`boundaries` sets how many pages show at each end, `siblings` how many on either side of the current one. Both default to `1`:

```typescript
getPageWindow(10, 20, { boundaries: 2, siblings: 2 });
// [1, 2, 'gap', 8, 9, 10, 11, 12, 'gap', 19, 20]
```

### Paging without history entries

To keep paging out of the Back button's way, replace the current entry instead of pushing one:

```typescript
this.list.setPage(page, { replace: true });
```

## Related

- [Lists in the URL](/guide/lists/): `injectQubeeList()`, `setPage()`, `href()` and links
- [Fetching data](/guide/fetching-data/#fetching-a-list): `qubeeHttpResource()` and keeping the previous page
- [Pagination](/guide/pagination/): the same controls on a `QubeeQueryBuilder`, with its page signals
- [Sortable table headers](/recipes/sortable-headers/): the other half of a data table
- [Building pagination and sort controls ↗](https://qubeejs.andreatantimonaco.me/guide/pagination/#building-pagination-and-sort-controls): every option of `getPageWindow()` and `getPageRange()`
- [`PaginatedCollection` ↗](https://qubeejs.andreatantimonaco.me/api/models/paginated-collection/): what each driver fills in
