---
sidebar_position: 1
title: Getting Started
---

# Getting Started

`@qubeejs/angular` is the Angular adapter for [`@qubeejs/core`](https://qubeejs.andreatantimonaco.me) — a query builder and paginator that composes API request URIs (filters, sorts, pagination, column selection) and parses paginated responses, with a pluggable driver system that targets eighteen backends.

- **Signals all the way down** — the URI, the query state and every pagination flag are Angular Signals. No RxJS.
- **Pagination ready** — typed `PaginatedCollection<T>`, fluent navigation, auto-sync from response to query state
- **Lists in the URL** — `injectQubeeList()` keeps filters, sorts and the page in the address bar as typed signals ([Lists in the URL](./lists.md))
- **Tree-shakeable drivers** — import the one definition you use; the other seventeen stay out of your bundle
- **Multi-driver:** API Platform (Symfony), Directus, Django REST Framework, FeathersJS, JSON:API, json-server, Laravel (pagination-only), Spatie Query Builder, NestJS (nestjs-paginate), @nestjsx/crud, OData, Payload CMS, PocketBase, PostgREST / Supabase, Sieve (.NET), Spring Data REST, Strapi, WordPress REST

:::tip Upgrading from ng-qubee 3.x?
The [changelog](https://github.com/AndreaAlhena/qubeejs-angular/blob/master/CHANGELOG.md) carries a line-by-line migration table. The short version: install `@qubeejs/angular` + `@qubeejs/core`, pass `STRAPI_DRIVER` instead of `DriverEnum.STRAPI`, and read `generateUri()` as a string (or the `uri` signal) instead of subscribing to it.
:::

## Requirements

| Dependency | Range |
|---|---|
| Angular | `>=17.0.0` |
| `@qubeejs/core` | `^1.6.0` |
| `@angular/router` | `>=17.0.0`, only for `@qubeejs/angular/router` |

**Why 17 is the floor.** The library is built on `signal()` and `computed()`, which left developer preview in Angular 17; it uses nothing newer than that — `inject()`, `DestroyRef`, `untracked()` and `makeEnvironmentProviders()` are older still. `effect()` and `httpResource()` appear only in the docs examples, never in the library, so Angular 17 applications use the `HttpClient` shape shown in [Fetching data](./fetching-data.md#alternative-httpclient-angular-17-to-191).

**Why there is no ceiling.** The package is published in Angular's partial compilation mode, so the *consuming* application's compiler links the declarations at its own version — the version the library was built with does not constrain the version it runs on. The 3.x line capped the range at the current major and paid for it on every Angular release with an `ERESOLVE` install failure until a widening release shipped. 4.x leaves the range open and instead verifies every supported major in CI — the floor (17), the middle (20), the current release (22) and Angular's `next` prerelease as an early warning — by installing the packed artifact into a freshly scaffolded application and building it. RxJS is not a dependency: the URI and the pagination state are exposed as signals, not Observables.

## Installation

```bash
npm install @qubeejs/angular @qubeejs/core
```

`@qubeejs/core` is a peer dependency. npm 7+ installs it for you, but listing it explicitly keeps your `package.json` honest about the version you depend on.

## Configure a driver

Pick a driver at bootstrap by passing its **definition**. There's no default — every driver speaks a different wire format and the library wants you to be explicit.

```typescript title="main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { SPATIE_DRIVER, provideQubee } from '@qubeejs/angular';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideQubee({ driver: SPATIE_DRIVER })
  ]
});
```

Module-style equivalent:

```typescript title="app.module.ts"
import { NgModule } from '@angular/core';
import { QubeeModule, SPATIE_DRIVER } from '@qubeejs/angular';

@NgModule({
  imports: [
    QubeeModule.forRoot({ driver: SPATIE_DRIVER })
  ]
})
export class AppModule {}
```

Passing a definition rather than an id is what lets the unused drivers tree-shake. When the backend is only known at runtime, look the definition up in the registry — the cost of bundling every driver is then visible at your own import site:

```typescript
import { DRIVERS, provideQubee } from '@qubeejs/angular';

// environment.driver: 'strapi' | 'laravel' | … (or a DriverEnum member)
provideQubee({ driver: DRIVERS[environment.driver] });
```

## Build your first request

Inject the service, set a resource, add filters / sorts / pagination, and read the URI — synchronously with `generateUri()`, or reactively through the `uri` signal:

```typescript
import { Component, inject } from '@angular/core';
import { QubeeQueryBuilder, SortEnum } from '@qubeejs/angular';

@Component({ /* ... */ })
export class UsersComponent {
  private readonly _qb = inject(QubeeQueryBuilder);

  constructor() {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addSort('created_at', SortEnum.DESC)
            .setLimit(25);

    // Spatie driver: /users?filter[status]=active&limit=25&page=1&sort=-created_at
    console.log(this._qb.generateUri());
  }
}
```

`this._qb.uri()` returns the same string and, being a signal, re-evaluates whenever the query changes — which is what lets `httpResource(() => this._qb.uri())` re-fetch on every filter or page change. See [Fetching data](./fetching-data.md).

The exact URI shape depends on the driver. See the [Drivers](./drivers/json-api.md) section for the format produced by each.

## Pick a driver

Eighteen drivers ship out of the box:

| Driver | Best for |
|---|---|
| [**JSON:API**](./drivers/json-api.md) | Any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir) |
| [**Laravel**](./drivers/laravel.md) | Plain Laravel pagination (limit + page only — no filters/sorts) |
| [**Spatie**](./drivers/spatie.md) | [Spatie Query Builder](https://spatie.be/docs/laravel-query-builder) for Laravel |
| [**NestJS**](./drivers/nestjs.md) | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) |
| [**PostgREST**](./drivers/postgrest.md) | [PostgREST](https://postgrest.org/) and [Supabase](https://supabase.com/) |
| [**Strapi**](./drivers/strapi.md) | [Strapi](https://strapi.io/) v4 / v5 headless CMS |
| [**DRF**](./drivers/drf.md) | [Django REST Framework](https://www.django-rest-framework.org/) + [django-filter](https://django-filter.readthedocs.io/) |
| [**@nestjsx/crud**](./drivers/nestjsx-crud.md) | [@nestjsx/crud](https://github.com/nestjsx/crud) CRUD framework for NestJS |
| [**Spring**](./drivers/spring.md) | [Spring Data REST](https://spring.io/projects/spring-data-rest) (Java / Spring Boot, HAL responses) |
| [**Sieve**](./drivers/sieve.md) | [Sieve](https://github.com/Biarity/Sieve) for ASP.NET Core |
| [**OData**](./drivers/odata.md) | [OData v4](https://www.odata.org/) (ASP.NET Core OData, SAP, Microsoft Graph) |
| [**Directus**](./drivers/directus.md) | [Directus](https://directus.io/) headless CMS / data platform |
| [**json-server**](./drivers/json-server.md) | [json-server](https://github.com/typicode/json-server) mock REST API for prototyping |
| [**API Platform**](./drivers/api-platform.md) | [API Platform](https://api-platform.com/) for PHP/Symfony (Hydra/JSON-LD) |
| [**Feathers**](./drivers/feathers.md) | [FeathersJS](https://feathersjs.com/) realtime/REST framework for Node.js |
| [**PocketBase**](./drivers/pocketbase.md) | [PocketBase](https://pocketbase.io/) single-binary backend (SQLite + realtime + auth) |
| [**Payload**](./drivers/payload.md) | [Payload CMS](https://payloadcms.com/) and any `mongoose-paginate-v2` backend |
| [**WordPress**](./drivers/wordpress.md) | [WordPress REST API](https://developer.wordpress.org/rest-api/) (every WP install since 4.7) |

Each driver page shows its definition constant (`STRAPI_DRIVER`, `LARAVEL_DRIVER`, …), the wire format it emits, and the methods it supports.

## Next steps

- [Fetching data](./fetching-data.md) — wire the `uri` signal into `httpResource()` and parse the result
- [Query Builder API](./query-builder.md) — every fluent method on `QubeeQueryBuilder`
- [Pagination](./pagination.md) — navigation helpers, pagination signals, auto-sync, response parsing
- [Per-component instances](./per-component-instances.md) — isolate state per feature component
