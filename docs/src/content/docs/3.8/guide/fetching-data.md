---
slug: 3.8/guide/fetching-data
title: "Fetching data"
---

`ng-qubee` builds the URI and parses the response, but it deliberately stays out of the HTTP layer — you bring your own `HttpClient`. This page shows how to wire the three pieces together in a typical service class.

The recommended shape is a **reactive client paired with `provideNgQubeeInstance()`** — each feature component gets its own `NgQubeeService`, the client subscribes to that instance's `uri$` once, and any state mutation (filter, sort, page) is auto-published as a fresh fetch. The example assumes the **Spatie driver**, but the flow is identical for API Platform, Directus, Feathers, JSON:API, json-server, NestJS, @nestjsx/crud, Laravel, OData, Payload, PocketBase, Sieve, Strapi, Spring, and DRF. The PostgREST and WordPress variants differ only in passing headers to `paginate()` — see the [end of the page](#variant-postgrest--supabase).

## A complete `UserClient` service

```typescript title="user-client.service.ts"
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, map } from 'rxjs';

import {
  NgQubeeService,
  PaginationService,
  PaginatedCollection,
  SortEnum
} from 'ng-qubee';

/** Domain model — what the API returns for each user record */
export interface User {
  id: number;
  email: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
}

@Injectable()
export class UserClient {

  private readonly _qb = inject(NgQubeeService);
  private readonly _pagination = inject(PaginationService);
  private readonly _http = inject(HttpClient);

  /**
   * Live stream of the current page's PaginatedCollection<User>
   *
   * Subscribed once at component-init via the async pipe. Every state
   * mutation followed by `generateUri()` pushes a new URI onto the
   * scoped `uri$` subject; switchMap cancels any in-flight HTTP and
   * fires a fresh request, paginate auto-syncs page/lastPage back into
   * NestService, the async pipe re-renders. No manual subscription
   * management.
   */
  public readonly users$: Observable<PaginatedCollection<User>> = this._qb.uri$.pipe(
    switchMap(uri => this._http.get<unknown>(uri)),
    map(body => this._pagination.paginate<User>(body as Record<string, unknown>))
  );

  /**
   * Compose the base list query and trigger the first fetch
   */
  public list(): void {
    this._qb.setResource('users')
            .addSort('created_at', SortEnum.DESC);

    this._qb.generateUri();
  }

  /**
   * Apply a free-text search and refetch
   */
  public search(term: string): void {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addFilter('name', term);

    this._qb.generateUri();
  }

  /**
   * Advance to the next page and refetch
   *
   * Bounds are auto-known after the first list() call because
   * PaginationService.paginate() syncs lastPage back into NestService.
   */
  public next(): void {
    this._qb.nextPage();

    this._qb.generateUri();
  }

  /**
   * Step back to the previous page and refetch
   */
  public previous(): void {
    this._qb.previousPage();

    this._qb.generateUri();
  }
}
```

### What's happening

1. **`users$`** is the long-lived stream the component subscribes to via the async pipe. Built once when the client is constructed.
2. **`setResource(...)`, `addFilter(...)`, etc.** are synchronous state mutations on `NestService`. They return `this` and don't fire anything by themselves.
3. **`generateUri()`** synchronously computes a URI from current state and pushes it onto the scoped `uri$` subject. It returns the subject too, but the reactive pattern ignores the return value — the side-effect is the trigger.
4. **`switchMap(uri => http.get(uri))`** cancels any in-flight HTTP when a newer URI arrives. Old requests can never overwrite a newer page's data.
5. **`paginationService.paginate<User>(body)`** parses the response into a typed `PaginatedCollection<User>` and auto-syncs `page` + `lastPage` back into the same scoped `NestService` — so navigation helpers like `nextPage()` immediately know their bounds.

## Wiring it into a component

The component scopes both `UserClient` and the `provideNgQubeeInstance()` providers so each instance of the component owns its own query state and its own fetch pipeline. The template subscribes once via the async pipe; `next()` / `previous()` calls just push state and let the pipeline propagate.

```typescript title="user-list.component.ts"
import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';

import { NgQubeeService, provideNgQubeeInstance } from 'ng-qubee';

import { UserClient } from './user-client.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [AsyncPipe],
  // Scope the entire ng-qubee stack + the client to this component instance
  providers: [
    ...provideNgQubeeInstance(),
    UserClient
  ],
  template: `
    @if (client.users$ | async; as page) {
      <ul>
        @for (u of page.data; track u.id) {
          <li>{{ u.name }} — {{ u.email }}</li>
        }
      </ul>

      <button [disabled]="qb.isFirstPage()" (click)="client.previous()">Prev</button>
      <span>Page {{ qb.currentPage() }} of {{ qb.totalPages() }}</span>
      <button [disabled]="qb.isLastPage()" (click)="client.next()">Next</button>
    }
  `
})
export class UserListComponent implements OnInit {

  protected readonly client = inject(UserClient);
  protected readonly qb = inject(NgQubeeService);

  public ngOnInit(): void {
    this.client.list();
  }
}
```

The template uses `qb.isFirstPage()` / `qb.isLastPage()` for the disable bindings — those predicates are template-safe and return conservative defaults before the first response syncs, so the buttons render correctly on the very first frame. See [Pagination → Predicates](/3.8/guide/pagination/#predicates-template-safe).

`client.next()` is bound directly in the click handler — no event handler method on the component is needed. The async pipe handles the subscription lifecycle; nothing leaks when the component is destroyed.

## Why scope per component

The reactive pipeline only works cleanly when **the client owns its own `NgQubeeService`**. If `UserClient` were `providedIn: 'root'` and shared a single `NgQubeeService` with the rest of the app, every other consumer's `generateUri()` call would push a URI onto the same `uri$` subject — and the user list pipeline would re-fire HTTP for **product** URIs, **invoice** URIs, anything. `provideNgQubeeInstance()` gives each component a private `NgQubeeService` + `NestService` + `PaginationService` and removes the cross-talk entirely.

## Variant: PostgREST / Supabase

PostgREST returns a bare array body and reports the total count in the `Content-Range` HTTP header. Two things change in `users$`:

```typescript
public readonly users$: Observable<PaginatedCollection<User>> = this._qb.uri$.pipe(
  switchMap(uri => this._http.get<User[]>(uri, {
    observe: 'response',                          // ← keep the full response
    headers: { 'Prefer': 'count=exact' }          // ← ask PostgREST for the total
  })),
  map(response => this._pagination.paginate<User>(
    response.body as unknown as Record<string, unknown>,
    response.headers                              // ← pass headers to paginate()
  ))
);
```

When `IConfig.pagination` is set to `PaginationModeEnum.RANGE`, also merge in `paginationHeaders()`:

```typescript
public readonly users$: Observable<PaginatedCollection<User>> = this._qb.uri$.pipe(
  switchMap(uri => {
    const extra = this._qb.paginationHeaders() ?? {};   // null on every other driver
    return this._http.get<User[]>(uri, {
      observe: 'response',
      headers: { 'Prefer': 'count=exact', ...extra }
    });
  }),
  map(response => this._pagination.paginate<User>(
    response.body as unknown as Record<string, unknown>,
    response.headers
  ))
);
```

`paginationHeaders()` returns `null` for all drivers other than PostgREST in RANGE mode, so spreading the result is safe even on the API Platform / Directus / Feathers / Spatie / NestJS / @nestjsx/crud / JSON:API / json-server / Laravel / OData / Payload / PocketBase / Sieve / Strapi / Spring / DRF / WordPress path.

### WordPress

The WordPress driver follows the same header-passing shape — the body is a bare array and the totals live in `X-WP-Total` / `X-WP-TotalPages` (no `Prefer` request header needed; WordPress always sends them):

```typescript
public readonly posts$: Observable<PaginatedCollection<Post>> = this._qb.uri$.pipe(
  switchMap(uri => this._http.get<Post[]>(uri, { observe: 'response' })),
  map(response => this._pagination.paginate<Post>(
    response.body as unknown as Record<string, unknown>,
    response.headers
  ))
);
```

## Alternative: one-shot fetches (root-scoped clients)

If you can't use `provideNgQubeeInstance()` — e.g. `UserClient` is `providedIn: 'root'` and shared across the app — the reactive pattern is unsafe (cross-consumer URI leakage). Fall back to the imperative shape: each method returns a one-shot `Observable<PaginatedCollection<T>>` with `take(1)` so the subscription completes after a single emission and ignores any later URI pushes from elsewhere.

```typescript
import { take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserClient {

  private readonly _qb = inject(NgQubeeService);
  private readonly _pagination = inject(PaginationService);
  private readonly _http = inject(HttpClient);

  public list(): Observable<PaginatedCollection<User>> {
    this._qb.setResource('users').addSort('created_at', SortEnum.DESC);

    return this._fetch();
  }

  public next(): Observable<PaginatedCollection<User>> {
    this._qb.nextPage();

    return this._fetch();
  }

  public previous(): Observable<PaginatedCollection<User>> {
    this._qb.previousPage();

    return this._fetch();
  }

  private _fetch(): Observable<PaginatedCollection<User>> {
    return this._qb.generateUri().pipe(
      take(1),
      switchMap(uri => this._http.get<unknown>(uri)),
      map(body => this._pagination.paginate<User>(body as Record<string, unknown>))
    );
  }
}
```

The component then reassigns `users$ = client.next()` on each navigation rather than binding to a long-lived stream. The `take(1)` is critical here: without it, every `generateUri()` call **anywhere in the app** would re-fire HTTP through every dangling subscription. See [Per-component instances](/3.8/guide/per-component-instances/) for the full picture on when component-scoping does and doesn't fit.
