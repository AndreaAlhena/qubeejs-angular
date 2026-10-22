---
title: One builder per feature service
description: Give each root-scoped feature service a private query builder, paginator and store with createQubeeInstance(), so services never overwrite each other's query.
---

Data access often lives in root-scoped services, one per feature: a `UserApi`, a `PostApi`, each `providedIn: 'root'` and injected wherever the feature is shown. If each one injects `QubeeQueryBuilder`, they all get the one instance that `provideQubee()` registers for the whole application, and every call one service makes changes the query of the others. `provideQubeeInstance()` cannot help, because a root service has no component `providers` to put it in. `createQubeeInstance()` can: it gives each service a private builder, paginator and store, and keeps the driver you configured once.

## The problem

The application is configured once, with Strapi:

```typescript title="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { STRAPI_DRIVER, provideQubee } from '@qubeejs/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideQubee({ baseUrl: 'https://api.example.com', driver: STRAPI_DRIVER })
  ]
};
```

Two services, each written as if it owned the builder:

```typescript title="user-api.ts"
import { Injectable, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { QubeeQueryBuilder, RawResponse } from '@qubeejs/angular';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly _qb = inject(QubeeQueryBuilder); // the app-wide instance

  public readonly response = httpResource<RawResponse>(() => this._qb.uri());

  public list(): void {
    this._qb.setResource('users').setLimit(25);
  }
}
```

```typescript title="post-api.ts"
import { Injectable, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { QubeeQueryBuilder, RawResponse } from '@qubeejs/angular';

@Injectable({ providedIn: 'root' })
export class PostApi {
  private readonly _qb = inject(QubeeQueryBuilder); // ...the same instance

  public readonly response = httpResource<RawResponse>(() => this._qb.uri());

  public list(): void {
    this._qb.setResource('posts').setLimit(10);
  }
}
```

A home page calls `users.list()` and then `posts.list()`. Both services hold the same builder, so the second call overwrites the first: the resource becomes `posts` and the limit `10`. **Both** resources fetch `https://api.example.com/posts?pagination[page]=1&pagination[pageSize]=10`, and the user section shows posts. From then on, any page change or filter in one service re-fetches the other. When `paginate()` parses a response, it writes that response's page bounds into the store both services read, so the two can't even agree on how many pages there are.

A root service resolves its dependencies from the root injector, whichever component injects it first, so `provideQubeeInstance()` in a component's `providers` would not reach it.

## The solution

Each service creates its own instance in a field initialiser and keeps it private:

```typescript title="user-api.ts" ins="createQubeeInstance()"
import { Injectable, Signal, effect, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { PaginatedCollection, RawResponse, createQubeeInstance } from '@qubeejs/angular';

export type User = { id: number; name: string };

@Injectable({ providedIn: 'root' })
export class UserApi {
  // A field initialiser runs in an injection context: no injector needed.
  private readonly _qubee = createQubeeInstance();
  private readonly _response = httpResource<RawResponse>(() => this._qubee.builder.uri());
  private readonly _page = signal<PaginatedCollection<User> | undefined>(undefined);

  public readonly page: Signal<PaginatedCollection<User> | undefined> = this._page.asReadonly();
  public readonly isLoading: Signal<boolean> = this._response.isLoading;
  public readonly hasNextPage: Signal<boolean> = this._qubee.builder.hasNextPage;

  constructor() {
    // paginate() writes the page bounds into this service's private store.
    effect(() => {
      if (this._response.hasValue()) {
        this._page.set(this._qubee.paginator.paginate<User>(this._response.value()));
      }
    });
  }

  public list(): void {
    this._qubee.builder.setResource('users').setLimit(25);
  }

  public search(term: string): void {
    this._qubee.builder.setResource('users').addFilter('name', term);
  }

  public next(): void {
    this._qubee.builder.nextPage();
  }
}
```

```typescript title="post-api.ts" ins="createQubeeInstance()"
import { Injectable, Signal, effect, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { PaginatedCollection, RawResponse, SortEnum, createQubeeInstance } from '@qubeejs/angular';

export type Post = { id: number; title: string };

@Injectable({ providedIn: 'root' })
export class PostApi {
  private readonly _qubee = createQubeeInstance();
  private readonly _response = httpResource<RawResponse>(() => this._qubee.builder.uri());
  private readonly _page = signal<PaginatedCollection<Post> | undefined>(undefined);

  public readonly page: Signal<PaginatedCollection<Post> | undefined> = this._page.asReadonly();
  public readonly isLoading: Signal<boolean> = this._response.isLoading;
  public readonly hasNextPage: Signal<boolean> = this._qubee.builder.hasNextPage;

  constructor() {
    effect(() => {
      if (this._response.hasValue()) {
        this._page.set(this._qubee.paginator.paginate<Post>(this._response.value()));
      }
    });
  }

  public list(): void {
    this._qubee.builder.setResource('posts').addSort('publishedAt', SortEnum.DESC).setLimit(10);
  }

  public next(): void {
    this._qubee.builder.nextPage();
  }
}
```

A page that uses both:

```typescript title="home.component.ts"
import { Component, OnInit, inject } from '@angular/core';

import { PostApi } from './post-api';
import { UserApi } from './user-api';

@Component({
  selector: 'app-home',
  template: `
    <section>
      <h2>Users</h2>
      @for (user of users.page()?.data; track user.id) {
        <p>{{ user.name }}</p>
      }
      <button type="button" [disabled]="!users.hasNextPage()" (click)="users.next()">More users</button>
    </section>

    <section>
      <h2>Latest posts</h2>
      @for (post of posts.page()?.data; track post.id) {
        <p>{{ post.title }}</p>
      }
      <button type="button" [disabled]="!posts.hasNextPage()" (click)="posts.next()">More posts</button>
    </section>
  `
})
export class HomeComponent implements OnInit {
  protected readonly users = inject(UserApi);
  protected readonly posts = inject(PostApi);

  public ngOnInit(): void {
    this.users.list();
    this.posts.list();
  }
}
```

The two sections now fetch `/users?pagination[page]=1&pagination[pageSize]=25` and `/posts?sort[0]=publishedAt:desc&pagination[page]=1&pagination[pageSize]=10`. "More posts" fetches page 2 of the posts and nothing else, and each "More" button is disabled from its own service's page bounds.

## Why it works

`createQubeeInstance()` creates a small child injector whose parent is the injector of the current injection context (here the root injector, since the services are `providedIn: 'root'`). That child injector provides a new `QubeeSignalStore`, `QubeeQueryBuilder` and `QubeePaginator`, wired around the one store, and the function returns all three as `{ builder, paginator, store }`. The driver, the request and response strategies, the options and the base URL resolve through the parent, from `provideQubee()`. Only the state is new.

- **Every call is a new instance.** Two services make two instances that never see each other's resource, filters or page. The application-wide `QubeeQueryBuilder` is left alone, so any component that still injects it is unaffected.
- **It needs an injection context**, like `inject()`. A field initialiser or the constructor of an injectable has one, which is why `UserApi` and `PostApi` call it without arguments. Called from a method, an event handler or a `setTimeout` callback, it throws `NG0203`. There, pass an `Injector` explicitly; see [below](#an-instance-per-call).
- **There is nothing to tear down.** The instance holds no subscription and registers no `DestroyRef` callback. The child injector is referenced only by the three objects it created, so it is garbage-collected with them: in a root service, when the application goes; in a local variable, when the function returns.
- **`paginate()` runs in an effect.** It writes the page bounds into the store, which is how `hasNextPage()` learns the last page, and Angular forbids signal writes in `computed()`. The last page is not part of the URI, so that write leaves `uri()` as it was, and it does not fetch again.

:::caution[Root services keep their state]
A root service lives as long as the application, and so does its instance: the user list's filters and page are still set when the user comes back to the screen. That is often what you want. When it is not, keep the state in the URL with a [list](/guide/lists/) instead. Note that `reset()` returns *everything* to the defaults, including the base URL configured in `provideQubee()`, so call `setBaseUrl()` again after it if you configured one.
:::

## Variations

### An instance per call

Outside an injection context, inject an `Injector` once, in a field, and pass it in. Here a click handler asks for a CSV export URI long after the service was constructed, and each call builds its URI on a throwaway instance:

```typescript title="export-api.ts"
import { Injectable, Injector, inject } from '@angular/core';
import { createQubeeInstance } from '@qubeejs/angular';

@Injectable({ providedIn: 'root' })
export class ExportApi {
  private readonly _injector = inject(Injector);

  /**
   * Called from a click handler, long after construction: outside an
   * injection context, so the injector is passed explicitly.
   */
  public csvUri(year: number): string {
    const { builder } = createQubeeInstance(this._injector);

    return builder.setResource('invoices').addFilter('year', year).setLimit(1000).generateUri();
  }
}
```

`csvUri(2025)` returns `https://api.example.com/invoices?filters[year][$eq]=2025&pagination[page]=1&pagination[pageSize]=1000`. `generateUri()` is the synchronous, non-reactive read; nothing outlives the call.

### A service scoped to a component

If the service is not `providedIn: 'root'` but listed in a component's `providers`, it can `inject(QubeeQueryBuilder)` directly: list `provideQubeeInstance()` next to it, and the service gets that component's instance. [Fetching data](/guide/fetching-data/#with-the-query-builder) builds a `UserClient` that way.

## Related

- [Per-component instances: isolated state in a root-scoped service](/guide/per-component-instances/#isolated-state-in-a-root-scoped-service)
- [Two independent lists on one page](/recipes/independent-lists/): the same isolation for components, with `provideQubeeInstance()`
- [Fetching data: why scope per component](/guide/fetching-data/#why-scope-per-component)
- [Pagination: parsing a response](/guide/pagination/#parsing-a-response)
- [`createQubeeInstance()`](/api/providers/create-qubee-instance/) in the API reference
- [Building a query ↗](https://qubeejs.andreatantimonaco.me/guide/building-a-query/) in the core docs
