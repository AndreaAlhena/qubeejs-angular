---
sidebar_position: 4
title: Lists in the URL
---

# Lists in the URL

A list page that keeps its query in the URL — `/articles?q=react&sort=title&page=2` — survives a reload, can be shared, and works with the back button. `injectQubeeList()` gives such a list its typed state as signals, the request to fetch it with, and the functions that change it, all from one declaration.

The declaration is the core's [`defineList()`](https://qubeejs.andreatantimonaco.me/guide/lists/); this page covers what the Angular adapter adds on top: reading the URL through the Angular Router, writing it back, and fetching the page.

:::tip URL or memory?
Keep a list in the URL when the list **is** the page — an article index, search results, an admin table. Keep it [in memory](#lists-in-memory) when it lives **inside** something else — a dialog, a picker, a second table on the same screen — where history entries would be noise.
:::

## 1. Provide an adapter

A list reads and writes the URL through an adapter. With the Angular Router, provide the one from the `@qubeejs/angular/router` entry point next to `provideRouter()`:

```typescript title="main.ts"
import { provideRouter } from '@angular/router';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideQubeeRouterAdapter()]
});
```

| Adapter | From | For |
|---|---|---|
| `provideQubeeRouterAdapter()` | `@qubeejs/angular/router` | Applications using the Angular Router |
| `provideQubeeBrowserAdapter()` | `@qubeejs/angular` | Applications without a router: `history.pushState()` and `popstate` |
| `provideQubeeMemoryAdapter()` / `createQubeeMemoryAdapter()` | `@qubeejs/angular` | State kept out of the address bar — see [Lists in memory](#lists-in-memory) |

Only `@qubeejs/angular/router` imports `@angular/router`, so an application without the router never needs it installed. Without any adapter, `injectQubeeList()` throws `MissingRouterAdapterError`: it never falls back to browser history on its own, because inside a router that would leave the router out of step.

## 2. Declare the list

Declare each list once, as a module-level constant. Everything in `@qubeejs/core` is re-exported from `@qubeejs/angular`:

```typescript title="article-list.ts"
import {
  SortEnum,
  STRAPI_DRIVER,
  defineList,
  enumParam,
  integerParam,
  sortParam,
  stringParam
} from '@qubeejs/angular';

export const articleList = defineList({
  apply: (builder, { q, sort, status }) => {
    builder.setLimit(20);
    sort.forEach(({ field, order }) => builder.addSort(field, order));

    if (q) {
      builder.addFilter('title', q);
    }

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    q: stringParam('q'),
    status: enumParam('status', ['draft', 'published']),
    sort: sortParam('sort', {
      default: [{ field: 'publishedAt', order: SortEnum.DESC }],
      fields: ['publishedAt', 'title']
    })
  },
  qubee: { baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER },
  resource: 'articles'
});
```

A list carries its own `qubee` configuration and builds every request on a fresh builder, so it does not use — or need — `provideQubee()`. The core's [Lists & URL state](https://qubeejs.andreatantimonaco.me/guide/lists/) guide documents the params (`integerParam`, `stringParam`, `enumParam`, `booleanParam`, `listParam`, `sortParam`, or your own), and how a hand-edited URL falls back to defaults.

## 3. Use it in a component

```typescript title="articles.component.ts"
import { Component, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { RawResponse, getAriaSort, injectQubeeList } from '@qubeejs/angular';

import { articleList } from './article-list';

type Article = { id: number; title: string };

@Component({
  imports: [RouterLink],
  template: `
    <input
      [value]="list.state().q ?? ''"
      (input)="list.set({ q: $any($event.target).value }, { debounce: 300, replace: true })"
    />
    <button type="button" (click)="list.reset()">Clear filters</button>

    <table [attr.aria-busy]="list.isPending() || articles.isLoading()">
      <thead>
        <tr>
          <th [attr.aria-sort]="getAriaSort(list.state().sort, 'title')">
            <button type="button" (click)="list.toggleSort('title')">Title</button>
          </th>
        </tr>
      </thead>
      <tbody>
        @for (article of page()?.data; track article.id) {
          <tr><td>{{ article.title }}</td></tr>
        }
      </tbody>
    </table>

    <a [routerLink]="router.parseUrl(list.href({ page: list.state().page + 1 }))">Next</a>
  `
})
export class ArticlesComponent {
  protected readonly getAriaSort = getAriaSort;
  protected readonly router = inject(Router);
  protected readonly list = injectQubeeList(articleList);

  // Fetches once per navigation — never per keystroke — and aborts a stale request.
  protected readonly articles = httpResource<RawResponse>(() => {
    const { headers, uri } = this.list.request();

    return { headers: headers ?? undefined, url: uri };
  });

  protected readonly page = computed(() =>
    this.articles.hasValue()
      ? this.list.request().paginate<Article>(this.articles.value(), this.articles.headers())
      : undefined
  );
}
```

The component names no router: the adapter decides where the URL lives.

### What the handle gives you

| Member | Type | What it does |
|---|---|---|
| `state` | `Signal<ListState>` | The typed state, including changes `set()` has not written to the URL yet — an input never lags behind a debounce |
| `request` | `Signal<ListRequest>` | `{ uri, headers, paginate }` for the state **in the URL**. Changes once per navigation, and only when the URI or headers differ |
| `isPending` | `Signal<boolean>` | A debounce is waiting, or a navigation is in flight |
| `set(changes, { debounce?, replace? })` | | Apply `changes` and navigate — at most once per call. A change to anything but the page returns to page 1; `undefined` returns a param to its default |
| `setPage(page, { replace? })` | | `set({ page })` |
| `reset({ replace? })` | | Every param back to its default, in one navigation; a list already at its defaults does not navigate |
| `toggleSort(field, { multiple?, debounce?, replace? })` | | Present when the list declares exactly one `sortParam`; `field` is typed to its fields. Flips the primary sort, or starts a new field ascending; `multiple` keeps the other sorts |
| `href(changes?)` | `string` | The link for the current state with `changes` applied. Reads signals, so a template that calls it stays current |

Function members are plain properties, so the handle can be destructured: `const { state, set } = injectQubeeList(articleList)`.

### The URL is the source of truth

- Values equal to their defaults stay out of the URL, and parameters the list does not own (`?panel=edit`) are kept.
- Back, Forward or a link elsewhere drop whatever `set()` had not written yet and cancel a pending debounce.
- A click on any link while a debounce waits commits the debounce first, so the link the user follows is never overtaken by a search that was still waiting.
- Destroying the component (or the injector you passed) cancels a pending debounce.
- A navigation that a guard cancels drops the change it carried: `state` goes back to what the URL shows.

Every list that reads the same URL sees the same state. The draft and `isPending` belong to the handle that made the change: when several components need them, call `injectQubeeList()` once in their common parent and pass the handle down.

### Links

Render links to other states of the list with `routerLink` rather than `href`, which would reload the page. From Angular 18.1, `routerLink` takes a `UrlTree`:

```html
<a [routerLink]="router.parseUrl(list.href({ page: 2 }))">2</a>
```

On Angular 17.0 to 18.0, hand over the query on its own — `href()` already carries every parameter the URL should keep:

```html
<a [routerLink]="[]" [queryParams]="router.parseUrl(list.href({ page: 2 })).queryParams">2</a>
```

To know whether a link points at the state on screen — for an active page number — compare `list.href(changes)` with `list.href()`, never raw query strings.

### Scroll position

A list navigation is an ordinary router navigation, so it follows your router's scrolling configuration. Angular's default (`scrollPositionRestoration: 'disabled'`) keeps the scroll position; with `withInMemoryScrolling({ scrollPositionRestoration: 'top' })` every page change scrolls to the top.

## Fetching on Angular 17 to 19.1

`httpResource()` ships with Angular 19.2. Before it, fetch in an `effect()` that reads `request()`:

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

## Lists that need more than the URL

`/projects/42/tasks?status=open` shows the tasks of project 42, but `42` lives in the path. A list declares what its request needs besides the URL as its **input**, by annotating the third parameter of `apply` (see the core's [Lists that need more than the URL](https://qubeejs.andreatantimonaco.me/guide/lists/#lists-that-need-more-than-the-url)). `injectQubeeList()` then requires it as `input` — a value, or a signal or function returning one:

```typescript
export const taskList = defineList({
  apply: (builder, { status }, { projectId }: { projectId: string }) => {
    builder.setResource(`projects/${encodeURIComponent(projectId)}/tasks`);

    if (status) {
      builder.addFilter('status', status);
    }
  },
  params: {
    page: integerParam('page', { default: 1, min: 1 }),
    status: enumParam('status', ['open', 'done'])
  },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'tasks'
});

// Route: { path: 'projects/:projectId/tasks', component: TasksComponent },
// with provideRouter(routes, withComponentInputBinding())
export class TasksComponent {
  public readonly projectId = input.required<string>();

  protected readonly tasks = injectQubeeList(taskList, {
    input: () => ({ projectId: this.projectId() })
  });
}
```

- The input is **required** for a list that declares one, and refused for a list that declares none — both are compile errors.
- It reaches `request`, never the URL. An equal input keeps the same `request`, so nothing re-fetches.
- `null` means "not ready yet": `request()` is `null`, and an `httpResource()` that returns `undefined` for it stays idle:

```typescript
public readonly projectId = input<string>();  // optional this time

protected readonly tasks = injectQubeeList(taskList, {
  input: () => {
    const projectId = this.projectId();       // read once, so TypeScript narrows it

    return projectId ? { projectId } : null;
  }
});

protected readonly response = httpResource<RawResponse>(() => {
  const request = this.tasks.request();

  return request ? { headers: request.headers ?? undefined, url: request.uri } : undefined;
});
```

`input()` signals need Angular 17.1; on 17.0, read the route parameter from `ActivatedRoute` instead.

## Lists in memory

The same definition works without a URL. For state that belongs to one component, pass a memory adapter to that list:

```typescript
protected readonly tags = injectQubeeList(tagList, { adapter: createQubeeMemoryAdapter() });
```

For state shared by a subtree, provide one in the parent's `providers`; it is gone with the component:

```typescript
@Component({
  providers: [provideQubeeMemoryAdapter('status=draft')],
  template: `<app-tag-filters /><app-tag-table />`
})
export class TagPickerComponent {}
```

There is no history: `replace` makes no difference and there is no Back. Everything else — typed state, `set()`, debounce, `request` — behaves as with a URL.

## Outside a component

`injectQubeeList()` runs in an injection context — a field initialiser or constructor. Elsewhere, pass an `injector`; the list then lives, and cancels its debounce, with that injector:

```typescript
const list = injectQubeeList(articleList, { injector: this._injector });
```

## Writing an adapter

An adapter is an object with a `location` signal and a `navigate()` function, provided under `QUBEE_LIST_ADAPTER`:

```typescript
import type { QubeeListAdapter } from '@qubeejs/angular';

const adapter: QubeeListAdapter = {
  location,                                         // Signal<{ pathname: string; search: string }>
  navigate: (href, { replace }) => myRouter.go(href, { replace })
};

providers: [{ provide: QUBEE_LIST_ADAPTER, useValue: adapter }]
```

`navigate()` may return a promise; the list reports `isPending` until it settles, and drops its draft if the URL did not reach the target by then.
