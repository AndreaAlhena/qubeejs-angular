---
slug: 3.8/api/classes/spatie-response-strategy
title: "SpatieResponseStrategy"
---

Defined in: [src/lib/strategies/spatie-response.strategy.ts:27](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/spatie-response.strategy.ts#L27)

Response strategy for the Spatie Query Builder driver

Parses flat Laravel-style pagination responses (Spatie's Query Builder
is built on Laravel's pagination):
```json
{
  "data": [...],
  "current_page": 1,
  "total": 100,
  "per_page": 15,
  "from": 1,
  "to": 15,
  ...
}
```

The traversal algorithm (flat `response[options.X]` lookups) is
inherited from `AbstractFlatResponseStrategy`; this class exists so
`DriverEnum.SPATIE` resolves to a distinct identity at the DI layer
even though the parsing logic is shared with the plain Laravel driver.

## See

https://spatie.be/docs/laravel-query-builder

## Extends

- `AbstractFlatResponseStrategy`

## Constructors

### Constructor

> **new SpatieResponseStrategy**(): `SpatieResponseStrategy`

#### Returns

`SpatieResponseStrategy`

#### Inherited from

`AbstractFlatResponseStrategy.constructor`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/abstract-flat-response.strategy.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-flat-response.strategy.ts#L35)

Parse a flat-envelope pagination response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response object

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Inherited from

`AbstractFlatResponseStrategy.paginate`
