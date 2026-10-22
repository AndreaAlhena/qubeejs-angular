---
title: A debounced search box kept in the URL
description: A search input whose term lives in the URL, written once the user pauses with set({ q }, { debounce }), with the input never lagging behind.
---

A search box on a list page should put its term in the URL (`/articles?q=react`), so the results survive a reload and can be shared. Writing the URL on every keystroke costs a navigation, a history entry and a request per letter. Waiting for the user to pause solves that, but the input still has to show every letter as it is typed, the results should say they are out of date, and the list should go back to page 1 when the term changes. `set()` on a list from `injectQubeeList()` handles all of this when it is given a `debounce`.

## The problem

The direct version writes the term on every `input` event:

```typescript
@Component({
  selector: 'app-naive-search',
  template: `<input type="search" [value]="list.state().q ?? ''" (input)="search($event)" />`
})
export class NaiveSearchComponent {
  protected readonly list = injectQubeeList(articleList);
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  protected search(event: Event): void {
    this.list.set({ q: (event.target as HTMLInputElement).value });
  }
}
```

Typing "react" makes five navigations, `?q=r`, `?q=re`, `?q=rea`, `?q=reac` and `?q=react`, each one pushing a history entry, and five requests, four of which are aborted when the next keystroke arrives. Back now steps through every prefix of the word before it leaves the page.

## The solution

Declare `q` as a `stringParam`:

```typescript title="article-list.ts"
import { SPATIE_DRIVER, defineList, enumParam, integerParam, stringParam } from '@qubeejs/angular';

export const articleList = defineList({
  apply: (builder, { q, status }) => {
    builder.setLimit(20);

    const term = q?.trim();

    if (term) {
      builder.addFilter('title', term);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ['draft', 'published'])
  },
  qubee: { baseUrl: 'https://api.example.com', driver: SPATIE_DRIVER },
  resource: 'articles'
});
```

Then let `set()` wait 300 ms of quiet before it navigates, replacing the history entry instead of pushing one:

```typescript title="article-search.component.ts"
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectQubeeList } from '@qubeejs/angular';
import { qubeeHttpResource } from '@qubeejs/angular/http';

import { articleList } from './article-list';

type Article = { id: number; title: string };

@Component({
  selector: 'app-article-search',
  imports: [RouterLink],
  template: `
    <label for="article-search">Search articles</label>
    <input
      id="article-search"
      type="search"
      [value]="list.state().q ?? ''"
      (input)="search($event)"
      (keydown.enter)="searchNow($event)"
    />

    <p role="status">
      @if (list.isPending() || articles.isLoading()) {
        Searching…
      }
    </p>

    <a [routerLink]="router.parseUrl(list.href({ status: 'draft' }))">Drafts only</a>

    <ul [attr.aria-busy]="list.isPending() || articles.isLoading()">
      @for (article of articles.value()?.data; track article.id) {
        <li>{{ article.title }}</li>
      } @empty {
        @if (articles.value()) {
          <li>No articles match “{{ list.state().q }}”.</li>
        }
      }
    </ul>
  `
})
export class ArticleSearchComponent {
  protected readonly router = inject(Router);
  protected readonly list = injectQubeeList(articleList);

  // Follows the URL, not the input: one request per search, not per keystroke.
  protected readonly articles = qubeeHttpResource<Article>(this.list.request);

  protected search(event: Event): void {
    const { value } = event.target as HTMLInputElement;

    this.list.set({ q: value }, { debounce: 300, replace: true });
  }

  /** Enter skips the wait: the same change without a debounce navigates at once. */
  protected searchNow(event: Event): void {
    const { value } = event.target as HTMLInputElement;

    this.list.set({ q: value }, { replace: true });
  }
}
```

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

import { ArticleSearchComponent } from './article-search.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([{ path: 'articles', component: ArticleSearchComponent }]),
    provideQubeeRouterAdapter(),
    provideHttpClient()
  ]
};
```

### What happens as the user types

Starting from `/articles?page=3` and typing "r", "re", "react" about 100 ms apart:

| Moment | Input | URL | `isPending()` | Requests sent |
| --- | --- | --- | --- | --- |
| While typing | `react` | `/articles?page=3` | `true` | none |
| 300 ms after the last keystroke | `react` | `/articles?q=react`, replacing the entry | `false` once the navigation lands | one: `…?filter[title]=react&limit=20&page=1` |

Meanwhile the "Drafts only" link already points at `/articles?q=react&status=draft`, the term included.

## Why it works

- **`state` and `request` move at different times.** `set()` updates `state` at once, so the input bound to `list.state().q` never lags behind the user. `request` describes only what is in the URL, so it changes once, when the debounce ends and the navigation lands, and `qubeeHttpResource()` fetches once per search.
- **Each keystroke restarts the wait.** A call made during the wait replaces the pending change, so only the last value is written.
- **`isPending()` covers the gap.** It is `true` while the debounce waits and while the navigation is in flight; `articles.isLoading()` takes over while the request runs. Together they drive the "Searching…" status and `aria-busy`.
- **A new term returns to page 1.** Any change to a param other than `page` drops the page, so a search started on page 3 doesn't land on an empty page 3 of fewer results.
- **Clearing the box clears the URL.** An empty string writes nothing, so deleting the term removes `q` from the address bar instead of leaving `?q=`.
- **`replace` keeps history tidy.** With `replace: true`, a search edits the current history entry, so Back leaves the search instead of stepping through earlier terms. Leave `replace` off for discrete choices, such as a status filter or a page number, where Back should undo the choice.
- **Links see the pending term.** `href()` is built from the pending state, and a click on any link while the debounce waits commits the search first, so a link never drops what the user just typed. Following "Drafts only" mid-debounce lands on `?q=react&status=draft` with one request.
- **Nothing outlives the user's intent.** Enter calls `set()` with the same change and no debounce, which navigates at once. Typing back to the term in the URL cancels the wait. Back, Forward or a link elsewhere drop the pending change, and so does destroying the component.

:::tip[Trim in `apply`, not in the param]
`stringParam('q', { trim: true })` would trim the value read back into `state`, and the input bound to it would lose the space its user just typed. Keep the param as typed and trim where the request is built, as `apply` does above with `q?.trim()`.
:::

## Variations

### A shorter or longer pause

300 ms suits most typists; a search that hits a slow or expensive endpoint can wait longer. Each call takes its own options, so a status filter on the same list can navigate at once. If a search is still waiting when the filter changes, it goes along in that same navigation:

```typescript
protected search(value: string): void {
  this.list.set({ q: value }, { debounce: 500, replace: true }); // after half a second of quiet
}

protected filter(status: 'draft' | 'published'): void {
  this.list.set({ status }); // at once, pushing a history entry; a waiting search goes along
}
```

### Search without the URL

A search box inside a dialog or a picker shouldn't touch the address bar. Give that list a memory adapter: `debounce`, `state`, `isPending` and `request` behave the same, and `replace` makes no difference:

```typescript
protected readonly list = injectQubeeList(articleList, { adapter: createQubeeMemoryAdapter() });
```

## Related

- [Lists in the URL](/guide/lists/#the-url-is-the-source-of-truth): how drafts, debounces and navigations interact
- [Lists in memory](/guide/lists/#lists-in-memory): the same list without the address bar
- [Fetching data](/guide/fetching-data/#fetching-a-list): `qubeeHttpResource()` and stale requests
- [Pagination controls](/recipes/pagination-controls/): the page bar under the results
- [Lists & URL state ↗](https://qubeejs.andreatantimonaco.me/guide/lists/#params): `stringParam()` and its `trim` option
