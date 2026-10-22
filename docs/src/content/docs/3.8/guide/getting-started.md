---
slug: 3.8/guide/getting-started
title: "Getting Started"
---

:::note[One page for every 3.x release]
These docs cover `ng-qubee` 3.8. Every 3.x minor was additive — no 3.x release removed or renamed public API — so they apply to 3.3 through 3.7 too, minus what arrived later; the [changelog](/changelog/) says what arrived when. For `@qubeejs/angular` 4.0, see [Migrating from ng-qubee 3.x](/guide/migrating/).
:::

`ng-qubee` is a query builder for Angular. It composes API request URIs (filters, sorts, pagination, column selection) and parses paginated responses, with a pluggable driver system that targets ten backends today and is built to grow.

- Easily retrieve URIs from a service
- Pagination ready, with auto-sync from response to query state
- Reactive — URIs emit through an RxJS Observable
- Test-driven, 980+ specs covering every driver path
- **Multi-driver:** API Platform (Symfony), Directus, Django REST Framework, FeathersJS, JSON:API, json-server, Laravel (pagination-only), Spatie Query Builder, NestJS (nestjs-paginate), @nestjsx/crud, OData, Payload CMS, PocketBase, PostgREST / Supabase, Sieve (.NET), Spring Data REST, Strapi, WordPress REST

## Requirements

| Dependency | Range |
|---|---|
| Angular | `>=17.0.0 <23.0.0` |
| RxJS | `^7.2.0` |

Angular 17+ is required because the library uses Angular Signals for state management, and Signals left developer preview in v17.

RxJS 7.2+ is required because the library imports `filter` from the `rxjs` root, which only became a root export in 7.2.0.

## Installation

```bash
npm install ng-qubee
```

## Configure a driver

`ng-qubee` requires you to pick a driver at bootstrap. There's no default — every driver speaks a different wire format and the library wants you to be explicit.

```typescript title="main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { DriverEnum, provideNgQubee } from 'ng-qubee';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgQubee({ driver: DriverEnum.SPATIE })
  ]
});
```

Module-style equivalent:

```typescript title="app.module.ts"
import { NgModule } from '@angular/core';
import { DriverEnum, NgQubeeModule } from 'ng-qubee';

@NgModule({
  imports: [
    NgQubeeModule.forRoot({ driver: DriverEnum.SPATIE })
  ]
})
export class AppModule {}
```

## Build your first request

Inject the service, set a resource, add filters / sorts / pagination, and subscribe to the URI stream:

```typescript
import { Component } from '@angular/core';
import { NgQubeeService, SortEnum } from 'ng-qubee';

@Component({ /* ... */ })
export class UsersComponent {
  constructor(private _qb: NgQubeeService) {
    this._qb.setResource('users')
            .addFilter('status', 'active')
            .addSort('created_at', SortEnum.DESC)
            .setLimit(25);

    this._qb.generateUri().subscribe(uri => {
      // Spatie driver: /users?filter[status]=active&limit=25&page=1&sort=-created_at
      console.log(uri);
    });
  }
}
```

The exact URI shape depends on the driver. See the [Drivers](/3.8/drivers/json-api/) section for the format produced by each.

## Pick a driver

Eighteen drivers ship out of the box:

| Driver | Best for |
|---|---|
| [**JSON:API**](/3.8/drivers/json-api/) | Any [JSON:API](https://jsonapi.org/format/)-compliant backend (Rails, Django, .NET, Java, Elixir) |
| [**Laravel**](/3.8/drivers/laravel/) | Plain Laravel pagination (limit + page only — no filters/sorts) |
| [**Spatie**](/3.8/drivers/spatie/) | [Spatie Query Builder](https://spatie.be/docs/laravel-query-builder) for Laravel |
| [**NestJS**](/3.8/drivers/nestjs/) | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) |
| [**PostgREST**](/3.8/drivers/postgrest/) | [PostgREST](https://postgrest.org/) and [Supabase](https://supabase.com/) |
| [**Strapi**](/3.8/drivers/strapi/) | [Strapi](https://strapi.io/) v4 / v5 headless CMS |
| [**DRF**](/3.8/drivers/drf/) | [Django REST Framework](https://www.django-rest-framework.org/) + [django-filter](https://django-filter.readthedocs.io/) |
| [**@nestjsx/crud**](/3.8/drivers/nestjsx-crud/) | [@nestjsx/crud](https://github.com/nestjsx/crud) CRUD framework for NestJS |
| [**Spring**](/3.8/drivers/spring/) | [Spring Data REST](https://spring.io/projects/spring-data-rest) (Java / Spring Boot, HAL responses) |
| [**Sieve**](/3.8/drivers/sieve/) | [Sieve](https://github.com/Biarity/Sieve) for ASP.NET Core |
| [**OData**](/3.8/drivers/odata/) | [OData v4](https://www.odata.org/) (ASP.NET Core OData, SAP, Microsoft Graph) |
| [**Directus**](/3.8/drivers/directus/) | [Directus](https://directus.io/) headless CMS / data platform |
| [**json-server**](/3.8/drivers/json-server/) | [json-server](https://github.com/typicode/json-server) mock REST API for prototyping |
| [**API Platform**](/3.8/drivers/api-platform/) | [API Platform](https://api-platform.com/) for PHP/Symfony (Hydra/JSON-LD) |
| [**Feathers**](/3.8/drivers/feathers/) | [FeathersJS](https://feathersjs.com/) realtime/REST framework for Node.js |
| [**PocketBase**](/3.8/drivers/pocketbase/) | [PocketBase](https://pocketbase.io/) single-binary backend (SQLite + realtime + auth) |
| [**Payload**](/3.8/drivers/payload/) | [Payload CMS](https://payloadcms.com/) and any `mongoose-paginate-v2` backend |
| [**WordPress**](/3.8/drivers/wordpress/) | [WordPress REST API](https://developer.wordpress.org/rest-api/) (every WP install since 4.7) |

## Next steps

- [Query Builder API](/3.8/guide/query-builder/) — every fluent method on `NgQubeeService`
- [Pagination](/3.8/guide/pagination/) — navigation helpers, auto-sync, response parsing
- [Per-component instances](/3.8/guide/per-component-instances/) — isolate state per feature component
