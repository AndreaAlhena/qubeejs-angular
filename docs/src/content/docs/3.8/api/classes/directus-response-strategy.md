---
slug: 3.8/api/classes/directus-response-strategy
title: "DirectusResponseStrategy"
---

Defined in: [src/lib/strategies/directus-response.strategy.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/directus-response.strategy.ts#L41)

Response strategy for the Directus driver

Parses Directus collection responses (with `meta=total_count,filter_count`
requested, which the request strategy always does):

```json
{
  "data": [{ "id": 1, "title": "Hello" }],
  "meta": { "total_count": 48, "filter_count": 12 }
}
```

The default `total` path is `meta.filter_count` — the number of items
matching the current filter, which is the relevant total for paging a
filtered collection (`meta.total_count` ignores filters; point the
`total` path at it via `IPaginationConfig` if that is what you want).

The envelope carries **no current-page or page-size field**, so:

- `currentPage` falls back to **1** unless a `currentPage` path is
  configured and resolves (only guaranteed correct for single-page
  results — track the requested page in your own state for multi-page
  UIs).
- `perPage` resolves only when a `perPage` path is configured.
- `lastPage` is `ceil(total ÷ perPage)` when both are known; on a
  response that provably holds the whole filtered set it resolves
  to 1.

Every key path is overridable via `IPaginationConfig` (dot notation
supported), so custom wrappers that do include paging fields map
without subclassing.

## See

https://docs.directus.io/reference/query.html#meta

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new DirectusResponseStrategy**(): `DirectusResponseStrategy`

#### Returns

`DirectusResponseStrategy`

#### Inherited from

`AbstractDotPathResponseStrategy.constructor`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/directus-response.strategy.ts:51](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/directus-response.strategy.ts#L51)

Parse a Directus collection response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response body

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration (dot-notation paths supported)

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Overrides

`AbstractDotPathResponseStrategy.paginate`

***

### resolve()

> `protected` **resolve**(`response`, `path`): `unknown`

Defined in: [src/lib/strategies/abstract-dot-path-response.strategy.ts:73](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-dot-path-response.strategy.ts#L73)

Resolve a value from a response object using a dot-notation path

Supports both flat keys (`'data'`) and nested paths (`'meta.totalItems'`).

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw response object

##### path

`string`

The dot-notation path to resolve

#### Returns

`unknown`

The resolved value, or undefined if any segment is missing

#### Inherited from

`AbstractDotPathResponseStrategy.resolve`

***

### resolveFrom()

> `protected` **resolveFrom**(`response`, `options`, `currentPage`, `perPage?`): `number` \| `undefined`

Defined in: [src/lib/strategies/abstract-dot-path-response.strategy.ts:90](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-dot-path-response.strategy.ts#L90)

Resolve the "from" index value

If `options.from` resolves to a value in the response, use it.
Otherwise compute `(currentPage - 1) * perPage + 1` when both are known.

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw response object

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

##### currentPage

`number`

The current page number

##### perPage?

`number`

The number of items per page

#### Returns

`number` \| `undefined`

The "from" index, or `undefined` when neither path nor inputs suffice

#### Inherited from

`AbstractDotPathResponseStrategy.resolveFrom`

***

### resolveTo()

> `protected` **resolveTo**(`response`, `options`, `currentPage`, `perPage?`, `total?`): `number` \| `undefined`

Defined in: [src/lib/strategies/abstract-dot-path-response.strategy.ts:119](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-dot-path-response.strategy.ts#L119)

Resolve the "to" index value

If `options.to` resolves to a value in the response, use it.
Otherwise compute `Math.min(currentPage * perPage, total)` when all
three are known.

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw response object

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

##### currentPage

`number`

The current page number

##### perPage?

`number`

The number of items per page

##### total?

`number`

The total number of items

#### Returns

`number` \| `undefined`

The "to" index, or `undefined` when neither path nor inputs suffice

#### Inherited from

`AbstractDotPathResponseStrategy.resolveTo`
