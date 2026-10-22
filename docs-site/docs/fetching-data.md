---
sidebar_position: 3
title: Fetching data
---

# Fetching data

`@qubeejs/angular` builds the URI and parses the response, but it deliberately stays out of the HTTP layer — you bring your own client. This page shows how to wire the pieces together with signals.

The recommended shape pairs **`httpResource()` with `provideQubeeInstance()`**: each feature component gets its own `QubeeQueryBuilder`, the resource derives its request from that instance's `uri` signal, and any state mutation (filter, sort, page) re-fetches on its own. The example assumes the **Spatie driver**; the flow is identical for every other driver, and the PostgREST and WordPress variants differ only in handing response headers to `paginate()` — see the [end of the page](#variant-postgrest--supabase).

`httpResource()` ships with Angular 19.2+. On Angular 17 to 19.1, use the [`HttpClient` variant](#alternative-httpclient-angular-17-to-191) below.

:::note
Both shapes need `provideHttpClient()` in your bootstrap providers, next to `provideQubee()`.
:::

## A complete `UserClient` service

```typescript title="user-client.service.ts"
import { Injectable, Signal, effect, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

import {
  QubeeQueryBuilder,
  PaginatedCollection,
  QubeePaginator,
  RawResponse,
  SortEnum
} from '@qubeejs/angular';

/** Domain model — what the API returns for each user record */
export type User = {
  id: number;
  email: string;
  name: string;
  status: 'active' | 'pending' | 'inactive';
};

@Injectable()
export class UserClient {

  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _pagination = inject(QubeePaginator);

  /**
   * The HTTP resource. Its request is derived from the `uri` signal, so it
   * stays idle until a resource is set and re-fetches after every mutation —
   * no manual trigger, no subscription management.
   */
  private readonly _response = httpResource<RawResponse>(() => this._qb.uri());

  private readonly _page = signal<PaginatedCollection<User> | undefined>(undefined);

  /**
   * The current page, parsed and typed. `undefined` until the first
   * response lands.
   */
  public readonly page: Signal<PaginatedCollection<User> | undefined> = this._page.asReadonly();

  /** Loading flag, straight from the resource */
  public readonly isLoading: Signal<boolean> = this._response.isLoading;

  constructor() {
    // Parsing is a side effect — it syncs page and lastPage back into the
    // store — so it lives in an effect, not a computed.
    effect(() => {
      if (this._response.hasValue()) {
        this._page.set(this._pagination.paginate<User>(this._response.value()));
      }
    });
  }

  /**
   * Compose the base list query. Setting the resource is what wakes the
   * resource up.
   */
  public list(): void {
    this._qb.setResource('users')
            .addSort('created_at', SortEnum.DESC);
  }

  /**
   * Apply a free-text search. Filters reset the page to 1.
   */
  public search(term: string): void {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addFilter('name', term);
  }

  /**
   * Advance to the next page. Bounds are known after the first response,
   * because `paginate()` synced `lastPage` back into the store.
   */
  public next(): void {
    this._qb.nextPage();
  }

  /**
   * Step back to the previous page
   */
  public previous(): void {
    this._qb.previousPage();
  }
}
```

### What's happening

1. **`uri`** is a computed signal over the query state. It is `undefined` until `setResource()` runs, and `httpResource()` treats `undefined` as "idle" — so nothing is fetched before `list()` is called.
2. **`setResource(...)`, `addFilter(...)`, `nextPage()`** are synchronous writes to the shared `QubeeSignalStore`. Each one changes `uri()`, and the resource re-fetches. An in-flight request for a stale URI is cancelled.
3. **`paginate<User>(body)`** parses the body into a typed `PaginatedCollection<User>` and syncs `page` + `lastPage` back into the store, so `qb.totalPages()`, `qb.isLastPage()` and friends reflect the server-reported bounds. That write is why parsing lives in an `effect` and not in a `computed`.
4. That sync does **not** re-fetch: the URI string is unchanged, and the store's signal only notifies when the state actually differs.

## Wiring it into a component

The component scopes both `UserClient` and the `provideQubeeInstance()` providers, so each instance of the component owns its own query state and its own resource. The template reads signals; `next()` / `previous()` just write state and let the resource follow.

```typescript title="user-list.component.ts"
import { Component, OnInit, inject } from '@angular/core';

import { QubeeQueryBuilder, provideQubeeInstance } from '@qubeejs/angular';

import { UserClient } from './user-client.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  // Scope the entire stack + the client to this component instance
  providers: [
    ...provideQubeeInstance(),
    UserClient
  ],
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

`qb.isFirstPage()`, `qb.isLastPage()`, `qb.currentPage()` and `qb.totalPages()` are signals: the template re-renders exactly when they change, with or without zone.js. The predicates return conservative defaults before the first response syncs, so the buttons render correctly on the very first frame. See [Pagination → Predicates](./pagination.md#predicates-template-safe).

## Why scope per component

The reactive pipeline only works cleanly when **the client owns its own `QubeeQueryBuilder`**. If `UserClient` were `providedIn: 'root'` and shared a single `QubeeQueryBuilder` with the rest of the app, every other consumer's `setResource()` would change the same `uri` signal — and the user list resource would fetch **product** URIs, **invoice** URIs, anything. `provideQubeeInstance()` gives each component a private `QubeeQueryBuilder` + `QubeeSignalStore` + `QubeePaginator` and removes the cross-talk entirely. A root-scoped client that cannot be component-scoped gets the same isolation from [`createQubeeInstance()`](./per-component-instances.md#isolated-state-in-a-root-scoped-service).

## Variant: PostgREST / Supabase

PostgREST returns a bare array body and reports the total count in the `Content-Range` response header. Ask for it with `Prefer: count=exact`, and hand the response headers to `paginate()` — `httpResource()` exposes them as a signal:

```typescript
private readonly _response = httpResource<User[]>(() => {
  const url = this._qb.uri();

  if (url === undefined) {
    return undefined;                              // idle until a resource is set
  }

  return {
    url,
    headers: {
      'Prefer': 'count=exact',                     // ← ask PostgREST for the total
      ...(this._qb.paginationHeaders() ?? {})      // ← Range headers in RANGE mode, null otherwise
    }
  };
});

constructor() {
  effect(() => {
    if (this._response.hasValue()) {
      this._page.set(this._pagination.paginate<User>(
        this._response.value(),
        this._response.headers()                   // ← pass the response headers
      ));
    }
  });
}
```

`paginationHeaders()` is `null` for every driver except PostgREST configured with `PaginationModeEnum.RANGE`, so spreading it is safe everywhere. It only notifies when the header values change, so the sync performed by `paginate()` never triggers a second fetch.

### WordPress

Same shape — bare array body, totals in `X-WP-Total` / `X-WP-TotalPages`, which WordPress always sends (no `Prefer` header needed):

```typescript
private readonly _response = httpResource<Post[]>(() => this._qb.uri());

constructor() {
  effect(() => {
    if (this._response.hasValue()) {
      this._page.set(this._pagination.paginate<Post>(this._response.value(), this._response.headers()));
    }
  });
}
```

## Alternative: `HttpClient` (Angular 17 to 19.1)

Without `httpResource()`, fetch imperatively and set the signal from the callback. `HttpClient` returns an Observable, so this is the one place `.subscribe()` still appears — in your code, never in the library:

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { QubeeQueryBuilder, PaginatedCollection, QubeePaginator, RawResponse, SortEnum } from '@qubeejs/angular';

@Injectable()
export class UserClient {

  private readonly _qb = inject(QubeeQueryBuilder);
  private readonly _pagination = inject(QubeePaginator);
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

  public previous(): void {
    this._qb.previousPage();
    this._fetch();
  }

  private _fetch(): void {
    this._http.get<RawResponse>(this._qb.generateUri()).subscribe(body => {
      this._page.set(this._pagination.paginate<User>(body));
    });
  }
}
```

Each navigation calls `_fetch()` explicitly; there is no long-lived stream to leak, and a root-scoped client is safe here because nothing reacts to the shared `uri` signal on its own. For PostgREST and WordPress, request `{ observe: 'response' }` and pass `response.headers` as the second argument of `paginate()`.
