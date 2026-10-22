---
title: Per-component instances
description: Give a component or a root-scoped service its own query builder, paginator and store, inheriting the driver configured once.
---

By default, `provideQubee()` registers `QubeeQueryBuilder` at the **environment injector**, so every component that injects it shares the same query-builder state. That's the right default for an app with one query view at a time.

When you need an isolated instance — e.g. a feature component whose filters and pagination must not bleed into the app-wide one — spread `provideQubeeInstance()` into the component's `providers`:

```typescript
import { Component, inject } from '@angular/core';
import { QubeeQueryBuilder, provideQubeeInstance } from '@qubeejs/angular';

@Component({
  selector: 'app-product-list',
  providers: [...provideQubeeInstance()],
  template: '...'
})
export class ProductListComponent {
  private readonly _qb = inject(QubeeQueryBuilder);
}
```

The component gets its own `QubeeQueryBuilder`, `QubeeSignalStore`, and `QubeePaginator`. Driver, strategies, and options are inherited from the environment injector configured by `provideQubee()` — you still configure the library once at bootstrap.

## When to reach for it

- Two routes that show different paginated views simultaneously (e.g. master/detail with a list on each side)
- Reusable list components that should each track their own page / filters
- Tabs or panels where state must persist independently per tab
- Any component that binds `httpResource()` to `uri()` — a shared `uri` signal would re-fetch on every other consumer's mutation (see [Fetching data](/guide/fetching-data/#why-scope-per-component))
- Tests that need a clean state per spec

## Isolated state in a root-scoped service

`provideQubeeInstance()` needs a component injector to hang providers on. A **root-scoped feature service** — a `UserApi` and a `PostApi` both `providedIn: 'root'`, say — has none, and two such services injecting the shared `QubeeQueryBuilder` would stomp on each other's resource, filters and page. `createQubeeInstance()` gives each one a private builder, paginator and store, wired together and inheriting the driver configured by `provideQubee()`:

```typescript
import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RawResponse, createQubeeInstance } from '@qubeejs/angular';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly _qubee = createQubeeInstance();   // { builder, paginator, store }

  readonly users = httpResource<RawResponse>(() => this._qubee.builder.uri());

  list(): void {
    this._qubee.builder.setResource('users').setLimit(25);
  }
}
```

Call it from a field initialiser or constructor, where an injection context is available, or pass an `Injector` explicitly from anywhere else. Nothing needs tearing down — the child injector lives exactly as long as the objects it created.

## When the default is enough

- Single-list-per-page apps
- Apps where users navigate between routes (state can reset on route change via `reset()` in `OnInit`)

## The store

`QubeeSignalStore` is the state container the two services share within a scope. It extends the core's `QubeeStore` and adds a single member, `state: Signal<QueryBuilderState>`. You rarely need to inject it — `QubeeQueryBuilder.state` is the same signal — but it is public, so a component can observe the raw state if it wants to:

```typescript
import { effect, inject } from '@angular/core';
import { QubeeSignalStore } from '@qubeejs/angular';

const store = inject(QubeeSignalStore);

effect(() => console.log('filters are now', store.state().filters));
```

Snapshots are deeply frozen: mutating what `state()` returns throws instead of silently corrupting the next read.

## Public injection tokens

If you need finer-grained control, the DI tokens are exported:

```typescript
import {
  QUBEE_BASE_URL,           // the configured baseUrl, '' when none
  QUBEE_DRIVER,             // the DriverDefinition — read .id for 'strapi', 'laravel', …
  QUBEE_REQUEST_STRATEGY,
  QUBEE_REQUEST_OPTIONS,
  QUBEE_RESPONSE_STRATEGY,
  QUBEE_RESPONSE_OPTIONS
} from '@qubeejs/angular';
```

These are what `provideQubee()` registers. You can override any of them at any injector level, though the high-level helpers cover nearly every case. `QUBEE_LIST_ADAPTER`, the token [lists](/guide/lists/#writing-an-adapter) read their URL through, is provided separately, by the adapter providers.

## Recipes

- [Two independent lists on one page](/recipes/independent-lists/)
- [One builder per feature service](/recipes/feature-services/)
