---
slug: 3.8/api/interfaces/iquery-builder-state
title: "IQueryBuilderState"
---

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:13](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L13)

Represents the complete query builder state

This is a superset that covers the needs of all drivers.
Each driver reads only the fields it needs from this state.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:15](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L15)

The base URL to prepend to generated URIs

***

### embedded

> **embedded**: [`Embedded`](/3.8/api/type-aliases/embedded/)

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:17](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L17)

Embedded-resource selection (PostgREST only)

***

### fields

> **fields**: [`IFields`](/3.8/api/interfaces/ifields/)

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:19](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L19)

Per-model field selection (Spatie only)

***

### filters

> **filters**: [`IFilters`](/3.8/api/interfaces/ifilters/)

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L21)

Simple key-value filters (Spatie and NestJS)

***

### includes

> **includes**: `string`[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:23](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L23)

Related models to include (Spatie only)

***

### isLastPageKnown

> **isLastPageKnown**: `boolean`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:25](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L25)

Whether the last paginated response has synced `lastPage` into state

***

### lastPage

> **lastPage**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L27)

Last page number known from the most recent paginated response; only meaningful when `isLastPageKnown` is true

***

### limit

> **limit**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:29](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L29)

Number of items per page (all drivers)

***

### operatorFilters

> **operatorFilters**: [`IOperatorFilter`](/3.8/api/interfaces/ioperator-filter/)[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L31)

Filters with explicit operators (NestJS only)

***

### page

> **page**: `number`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L33)

Current page number (all drivers)

***

### resource

> **resource**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L35)

The API resource name for URI generation (all drivers)

***

### search

> **search**: `string`

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:37](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L37)

Full-text search term (NestJS only)

***

### select

> **select**: `string`[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:39](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L39)

Flat field selection (NestJS only)

***

### sorts

> **sorts**: [`ISort`](/3.8/api/interfaces/isort/)[]

Defined in: [src/lib/interfaces/query-builder-state.interface.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/query-builder-state.interface.ts#L41)

Sort configurations (Spatie and NestJS)
