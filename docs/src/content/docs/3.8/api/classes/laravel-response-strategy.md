---
slug: 3.8/api/classes/laravel-response-strategy
title: "LaravelResponseStrategy"
---

Defined in: [src/lib/strategies/laravel-response.strategy.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/laravel-response.strategy.ts#L28)

Response strategy for the Laravel (pagination-only) driver

Parses flat Laravel pagination responses:
```json
{
  "data": [...],
  "current_page": 1,
  "total": 100,
  "per_page": 15,
  "from": 1,
  "to": 15,
  "next_page_url": "...",
  "prev_page_url": "...",
  "first_page_url": "...",
  "last_page": 7,
  "last_page_url": "..."
}
```

The traversal algorithm (flat `response[options.X]` lookups) is
inherited from `AbstractFlatResponseStrategy`; this class exists so
`DriverEnum.LARAVEL` resolves to a distinct identity at the DI layer
even though the parsing logic is shared with Spatie.

## Extends

- `AbstractFlatResponseStrategy`

## Constructors

### Constructor

> **new LaravelResponseStrategy**(): `LaravelResponseStrategy`

#### Returns

`LaravelResponseStrategy`

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
