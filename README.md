<p align="center">
  <img width="500" height="500" src="https://i.ibb.co/LdXRKyG/logo.png">
</p>

# Your next Angular Query Builder 🐝

[![CI](https://github.com/AndreaAlhena/qubeejs-angular/workflows/CI/badge.svg)](https://github.com/AndreaAlhena/qubeejs-angular/actions)
[![codecov](https://codecov.io/gh/AndreaAlhena/qubeejs-angular/branch/master/graph/badge.svg)](https://codecov.io/gh/AndreaAlhena/qubeejs-angular)
[![npm version](https://badge.fury.io/js/%40qubeejs%2Fangular.svg)](https://www.npmjs.com/package/@qubeejs/angular)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`@qubeejs/angular` is the Angular adapter for [`@qubeejs/core`](https://github.com/AndreaAlhena/qubeejs-core). Compose your API requests without re-inventing the wheel, and read everything back as Signals.

- **Signals all the way down** — the URI, the query state and every pagination flag are Angular Signals. No RxJS.
- **Pagination ready** — typed `PaginatedCollection<T>`, fluent navigation (`nextPage`, `lastPage`, `goToPage`), auto-sync from response to state
- **Lists in the URL** — `injectQubeeList()` keeps filters, sorts and the page in the address bar as typed signals, through the Angular Router
- **Tree-shakeable drivers** — import the one definition you use and the other seventeen stay out of your bundle
- **Multi-driver support**: API Platform (Symfony), Directus, Django REST Framework, FeathersJS, JSON:API, json-server, Laravel (pagination-only), Spatie Query Builder, NestJS (`nestjs-paginate`), @nestjsx/crud, OData, Payload CMS, PocketBase, PostgREST / Supabase, Sieve (.NET), Spring Data REST, Strapi, and WordPress REST

> Upgrading from `ng-qubee` 3.x? The [changelog](./CHANGELOG.md) has a line-by-line migration table.

## 📚 Documentation

**Full documentation lives at [qubeejs-angular.andreatantimonaco.me](https://qubeejs-angular.andreatantimonaco.me)** — driver guides, query-builder API, pagination signals, auto-generated API reference, and version history. The framework-agnostic core is documented at [qubeejs.andreatantimonaco.me](https://qubeejs.andreatantimonaco.me).

This README is intentionally minimal. For everything beyond install + a ten-line example, head to the docs site.

## Requirements

- **Angular** `>=17.0.0` (built on Signals; every major from 17 is verified in CI, see [Requirements](https://qubeejs-angular.andreatantimonaco.me/docs/getting-started#requirements))
- **@qubeejs/core** `^1.6.0` (peer dependency)
- **@angular/router** `>=17.0.0`, only if you import `@qubeejs/angular/router`

## Install

```sh
npm i @qubeejs/angular @qubeejs/core
```

## Drivers

A driver **must** be specified in the configuration, as its exported definition:

| Driver | Definition | Backend | Wire format snapshot |
|---|---|---|---|
| **API Platform** | `API_PLATFORM_DRIVER` | [API Platform](https://api-platform.com/) for PHP/Symfony | `field=value`, `price[between]=10..50`, `order[field]=desc`, `page=N&itemsPerPage=N` |
| **Directus** | `DIRECTUS_DRIVER` | [Directus](https://directus.io/) headless CMS / data platform | `filter[field][_eq]=value`, `sort=-field`, `fields=col,rel.col`, `limit=N&page=N` |
| **DRF** | `DRF_DRIVER` | [Django REST Framework](https://www.django-rest-framework.org/) + [django-filter](https://django-filter.readthedocs.io/) | `field=value`, `field__gte=N`, `ordering=-field`, `page=N&page_size=M` |
| **Feathers** | `FEATHERS_DRIVER` | [FeathersJS](https://feathersjs.com/) database adapters | `field=value`, `field[$gte]=N`, `$sort[field]=-1`, `$select[0]=col`, `$limit=N&$skip=M` |
| **JSON:API** | `JSON_API_DRIVER` | Any [JSON:API](https://jsonapi.org/format/)-compliant backend | `filter[field]=value`, `sort=-field`, `page[number]=N&page[size]=N` |
| **json-server** | `JSON_SERVER_DRIVER` | [json-server](https://github.com/typicode/json-server) mock REST API | `field=value`, `field:gt=N`, `_sort=-field`, `q=term`, `_page=N&_per_page=N` |
| **Laravel** | `LARAVEL_DRIVER` | Plain Laravel pagination | `limit=N&page=N` (pagination only) |
| **Spatie** | `SPATIE_DRIVER` | [Spatie Laravel Query Builder](https://spatie.be/docs/laravel-query-builder) | `filter[field]=value`, `sort=-field` |
| **NestJS** | `NESTJS_DRIVER` | [`nestjs-paginate`](https://github.com/ppetzold/nestjs-paginate) | `filter.field=$op:value`, `sortBy=field:DESC` |
| **@nestjsx/crud** | `NESTJSX_CRUD_DRIVER` | [@nestjsx/crud](https://github.com/nestjsx/crud) for NestJS | `filter=field\|\|$eq\|\|value`, `sort=field,ASC`, `join=relation`, `page=N&limit=N` |
| **OData** | `ODATA_DRIVER` | [OData v4](https://www.odata.org/) (ASP.NET Core OData, SAP, Microsoft Graph) | `$filter=field eq 'value'`, `$orderby=field desc`, `$expand=rel($select=col)`, `$top=N&$skip=M` |
| **Payload** | `PAYLOAD_DRIVER` | [Payload CMS](https://payloadcms.com/) / `mongoose-paginate-v2` backends | `where[field][equals]=value`, `sort=-field`, `select[col]=true`, `page=N&limit=M` |
| **PocketBase** | `POCKETBASE_DRIVER` | [PocketBase](https://pocketbase.io/) single-binary backend | `filter=(field='value' && other>10)`, `sort=-field`, `expand=rel`, `fields=col`, `page=N&perPage=M` |
| **PostgREST** | `POSTGREST_DRIVER` | [PostgREST](https://postgrest.org/) / [Supabase](https://supabase.com/) | `col=eq.value`, `order=col.asc`, `select=col,rel(*)`, `limit=N&offset=M` |
| **Sieve** | `SIEVE_DRIVER` | [Sieve](https://github.com/Biarity/Sieve) for ASP.NET Core | `filters=Field==Value,Other>=N`, `sorts=-field`, `page=N&pageSize=N` |
| **Spring** | `SPRING_DRIVER` | [Spring Data REST](https://spring.io/projects/spring-data-rest) (HAL) | `sort=field,asc` (repeatable), `page=N&size=N` (0-indexed page) |
| **Strapi** | `STRAPI_DRIVER` | [Strapi](https://strapi.io/) v4 / v5 headless CMS | `filters[field][$eq]=value`, `sort[0]=field:asc`, `pagination[page]=N&pagination[pageSize]=N` |
| **WordPress** | `WORDPRESS_DRIVER` | [WordPress REST API](https://developer.wordpress.org/rest-api/) | `field=value`, `orderby=field&order=desc`, `_fields=col`, `_embed=rel`, `search=term`, `page=N&per_page=M` |

Per-driver guides — wire format, supported operators, response parsing, customisation — live on the [docs site](https://qubeejs-angular.andreatantimonaco.me/docs/getting-started). For a backend chosen at runtime, `provideQubee({ driver: DRIVERS[id] })` looks the definition up by its `DriverEnum` member or string id.

## Quick start

```typescript
import { Component, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { QubeeQueryBuilder, STRAPI_DRIVER, SortEnum, provideQubee } from '@qubeejs/angular';

bootstrapApplication(AppComponent, {
  providers: [provideQubee({ driver: STRAPI_DRIVER })]
});

@Component({ /* … */ })
export class ArticlesComponent {
  private readonly _qb = inject(QubeeQueryBuilder);

  // Re-fetches whenever a filter, sort or page changes; idle until a resource is set
  protected readonly articles = httpResource<unknown>(() => this._qb.uri());

  constructor() {
    this._qb
      .setResource('articles')
      .addFilter('status', 'published')
      .addSort('createdAt', SortEnum.DESC)
      .setLimit(10);

    console.log(this._qb.generateUri());
    // → /articles?filters[status][$eq]=published&sort[0]=createdAt:desc&pagination[page]=1&pagination[pageSize]=10
  }
}
```

## Lists in the URL

Declare a list once with the core's `defineList()`, and `injectQubeeList()` keeps its state in the address bar — it survives a reload, can be shared, and works with Back:

```typescript
import { STRAPI_DRIVER, defineList, injectQubeeList, integerParam, stringParam } from '@qubeejs/angular';
import { provideQubeeRouterAdapter } from '@qubeejs/angular/router';

export const articleList = defineList({
  apply: (builder, { q }) => {
    if (q) {
      builder.addFilter('title', q);
    }
  },
  params: { page: integerParam('page', { default: 1, min: 1 }), q: stringParam('q') },
  qubee: { driver: STRAPI_DRIVER },
  resource: 'articles'
});

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideQubeeRouterAdapter()]
});

@Component({ /* … */ })
export class ArticlesComponent {
  protected readonly list = injectQubeeList(articleList);

  // list.state().q, list.set({ q }, { debounce: 300 }), list.setPage(2), list.request().uri …
}
```

[Lists in the URL](https://qubeejs-angular.andreatantimonaco.me/docs/lists) covers fetching, debounce, lists that need a route param, and lists kept in memory.

The full query-builder API, pagination signals, per-driver feature matrices, and TypeScript types are documented at [qubeejs-angular.andreatantimonaco.me](https://qubeejs-angular.andreatantimonaco.me).

## License

MIT © [Andrea Tantimonaco](https://www.linkedin.com/in/andrea-tantimonaco/)
