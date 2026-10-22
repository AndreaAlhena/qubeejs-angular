---
title: Migrating from ng-qubee 3.x
description: What changes between ng-qubee 3.x and @qubeejs/angular 4.0, and how to update your code.
---

4.0 renames the package to `@qubeejs/angular`, moves the framework-agnostic half — drivers, strategies, models, enums, errors — into `@qubeejs/core`, drops RxJS for signals, and adds lists that keep their state in the URL. The fluent API you call every day keeps its names.

> The [3.8 docs](/3.8/guide/getting-started/) stay online for applications still on `ng-qubee`. `ng-qubee@3.x` stays on npm unchanged.

## At a glance

| 3.x | 4.0 |
| --- | --- |
| `npm i ng-qubee` | `npm i @qubeejs/angular @qubeejs/core` |
| `import { … } from 'ng-qubee'` | `import { … } from '@qubeejs/angular'` |
| `provideNgQubee({ driver: DriverEnum.STRAPI })` | `provideQubee({ driver: STRAPI_DRIVER })` |
| `NgQubeeModule.forRoot({ driver: DriverEnum.STRAPI })` | `QubeeModule.forRoot({ driver: STRAPI_DRIVER })` |
| `provideNgQubeeInstance()` | `provideQubeeInstance()` |
| `inject(NgQubeeService)` | `inject(QubeeQueryBuilder)` |
| `inject(PaginationService)` | `inject(QubeePaginator)` |
| `NG_QUBEE_DRIVER` (a `DriverEnum`), `NG_QUBEE_REQUEST_STRATEGY`, … | `QUBEE_DRIVER` (a `DriverDefinition`), `QUBEE_REQUEST_STRATEGY`, … |
| driver chosen at runtime | `provideQubee({ driver: DRIVERS[id] })` |
| `qb.generateUri().subscribe(uri => …)` | `const uri = qb.generateUri();` — or read `qb.uri()` |
| `qb.uri$` | `qb.uri` (a signal; `undefined` until a resource is set) |
| `qb.uri$.pipe(switchMap(uri => http.get(uri)))` | `httpResource(() => qb.uri())` |
| `inject(NestService).nest()` | `inject(QubeeSignalStore).state()` or `qb.state()` |
| `@angular/core` peer `>=17.0.0 <23.0.0` | `>=17.0.0` |
| `qb.totalPages()` throwing before sync | returns `undefined` before sync |
| `IConfig` | `QubeeConfig` |
| `IFields`, `IFilters`, `ISort`, `IOperatorFilter`, `IQueryBuilderState`, `IQueryBuilderConfig`, `IPaginationConfig`, `INormalized`, `IPaginatedObject`, `IStrategyCapabilities` | the same names without the `I` |
| `rxjs` in `peerDependencies` | not required by the library (Angular itself still peers it) |
| `addFilter('q', encodeURIComponent(term))` | `addFilter('q', term)` — values are encoded for you |
| `setBaseUrl()` after every `reset()` or in every instance | `provideQubee({ baseUrl, driver })` |

Everything else — the fluent mutators, `paginate()`, `PaginatedCollection`, the enums, the errors and the strategies — keeps its name and behaviour.

## Step by step

### 1. Swap the package

```bash
npm uninstall ng-qubee
npm install @qubeejs/angular @qubeejs/core
```

Replace `'ng-qubee'` with `'@qubeejs/angular'` in every import. Every driver, strategy, enum, error, model and type that used to live in `ng-qubee` now comes from `@qubeejs/core` and is re-exported unchanged, so `import { StrapiRequestStrategy, SortEnum, UnsupportedFilterError } from '@qubeejs/angular'` keeps resolving.

### 2. Pass a driver definition

`DriverEnum` no longer configures the provider; the driver's exported definition does:

```typescript
// 3.x
provideNgQubee({ driver: DriverEnum.STRAPI });

// 4.0
provideQubee({ driver: STRAPI_DRIVER });
```

Importing one definition lets the other nineteen drivers tree-shake out of the bundle. For a backend chosen at runtime, `DRIVERS[id]` keeps working and makes the cost visible at the import site. The `QUBEE_DRIVER` token now holds the `DriverDefinition`; read `.id` for the identifier.

### 3. Rename the Angular classes

The `Ng` prefix and the `Service` suffix are gone. Each Angular class is named after the core class it wraps, with the brand as prefix — unprefixed is the core (`QueryBuilder`, `Paginator`, `QubeeStore`), `Qubee`-prefixed is the Angular injectable with signals:

| 3.x | 4.0 |
| --- | --- |
| `NgQubeeService` | `QubeeQueryBuilder` |
| `PaginationService` | `QubeePaginator` |
| `NestService` | `QubeeSignalStore` |
| `NgQubeeModule` | `QubeeModule` |
| `provideNgQubee` | `provideQubee` |
| `provideNgQubeeInstance` | `provideQubeeInstance` |
| `buildNgQubeeProviders` | `buildQubeeProviders` |
| `NG_QUBEE_*` | `QUBEE_*` |

### 4. Read the URI without RxJS

RxJS is no longer a peer dependency and is not imported anywhere. `generateUri()` returns the URI **synchronously, as a string**, and throws on an invalid state instead of erroring an `Observable`. The `uri$` Observable is replaced by the `uri` signal, which is `undefined` until a resource is set — the idle value `httpResource()` understands:

```typescript
// 3.x
this._qb.generateUri().subscribe((uri) => this.load(uri));

// 4.0
this.load(this._qb.generateUri());

// 4.0, reactive: re-fetches on every filter, sort or page change
readonly users = httpResource<RawResponse>(() => this._qb.uri());
```

[Fetching data](/guide/fetching-data/) shows the whole pattern, including parsing the response.

### 5. Read pagination as signals

`currentPage`, `totalPages`, `isFirstPage`, `isLastPage`, `hasNextPage`, `hasPreviousPage` and `paginationHeaders` are now computed signals on `QubeeQueryBuilder`. They are still read as `qb.hasNextPage()`, so call sites compile unchanged, but they re-evaluate only when the state changes and are tracked by templates, `computed()`, `effect()` and `httpResource()`.

One behaviour changes: `totalPages()` returns `undefined` until a response has synced the bounds, where 3.x threw `PaginationNotSyncedError`. `lastPage()` keeps throwing, for imperative navigation.

`NestService` becomes `QubeeSignalStore`, a subclass of the core `QubeeStore` whose one addition is `state: Signal<QueryBuilderState>` — the old `nest` signal. Snapshots are deeply frozen, so mutating what `state()` returns now throws instead of silently corrupting later reads.

### 6. Drop the `I` prefixes

Types lose the `I` prefix — `IFields` → `Fields`, `IQueryBuilderState` → `QueryBuilderState`, `IPaginationConfig` → `PaginationConfig`, `IConfig` → `QubeeConfig`. `I` now marks only the interfaces a class implements, so `IRequestStrategy` and `IResponseStrategy` keep it. `IPaginatedObject` becomes `PaginatedObject`, and `paginate()` takes the core's `RawResponse`, which types the bare-array bodies PostgREST and WordPress return.

### 7. Stop encoding filter values yourself

:::caution[Bee aware]
Filter values and search terms are now percent-encoded by the driver. No 3.x driver encoded them, so a `&` in a value split it into a new parameter and a `#` cut off the rest of the URI. **If you called `encodeURIComponent()` on values yourself, remove it** — it now double-encodes.
:::

## URIs that change

The core's parity suite compares every driver's URIs against `ng-qubee@3.8.0`. They are identical except where 3.x was wrong:

- **Values are encoded** — see above. Keys, operator syntax and the `,` joining several values stay literal.
- **PocketBase** joins clauses with `%26%26` instead of a raw `&&`, which reached the server cut off at the first `&`; its `SW` wildcard is `%25`. **PostgREST** `CONTAINS` uses its documented `*` wildcard instead of a bare `%`.
- **Exactly one slash** joins the base URL and the resource: `setBaseUrl('https://api.dev/')` no longer gives `https://api.dev//articles`, and a resource with a leading slash no longer gives a protocol-relative `//projects/42/tasks`.
- On **JSON:API** and **Spatie**, `addFields()` on a nested resource (`users/42/followers`) sends the fields as given instead of throwing `KeyNotFoundError`.

## Also new in 4.0

- **Errors carry a `code`, `context` and `cause`**, from the core's `QubeeError` base, and `Unsupported*Error` messages name the active driver.
- **`baseUrl` in the config** — `provideQubee({ baseUrl, driver })` prefixes every URI, so there is no `setBaseUrl()` to repeat after each `reset()`.
- **`setParam()` / `deleteParams()`** — parameters no driver models, on every driver.
- **`createQubeeInstance()`** — isolated query state for a root-scoped service. See [Per-component instances](/guide/per-component-instances/#isolated-state-in-a-root-scoped-service).
- **Lists in the URL** — `injectQubeeList()`, with adapters for the Angular Router, the History API or memory. See [Lists in the URL](/guide/lists/).
- **`qubeeHttpResource()`** — fetches a list's page with `httpResource()`. See [Fetching data](/guide/fetching-data/).
- **Ransack and FastAPI drivers** — twenty drivers in all.
- **The Angular peer range is open upward** (`>=17.0.0`), so a new Angular major no longer needs a widening release before it installs.

The [changelog](/changelog/) lists every change.
