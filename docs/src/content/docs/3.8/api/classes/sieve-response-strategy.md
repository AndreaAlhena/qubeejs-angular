---
slug: 3.8/api/classes/sieve-response-strategy
title: "SieveResponseStrategy"
---

Defined in: [src/lib/strategies/sieve-response.strategy.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/sieve-response.strategy.ts#L34)

Response strategy for the Sieve (.NET) driver

Sieve itself does not define a response envelope — it returns an
`IQueryable` that the ASP.NET developer wraps in a paging DTO of their
choosing. This strategy therefore ships a **sensible default mapping**
for the common hand-rolled `PagedResult<T>` shape:
```json
{
  "data": [{ "id": 1, "title": "Hello" }],
  "page": 2,
  "pageSize": 10,
  "total": 48,
  "totalPages": 5
}
```

Every key path is configurable through `IConfig.response` (dot
notation supported), so any wrapper shape — `{ items, meta: {...} }`,
`{ results, pagination: {...} }` — can be mapped without subclassing.
Defaults are encoded in `SieveResponseOptions`. `from`/`to` are
computed from `page` × `pageSize` by the inherited traversal
algorithm, and the navigation-URL slots resolve to `undefined` unless
paths are provided.

The dot-notation traversal is inherited from
`AbstractDotPathResponseStrategy`; this class exists so
`DriverEnum.SIEVE` resolves to a distinct identity at the DI layer.

## See

https://github.com/Biarity/Sieve

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new SieveResponseStrategy**(): `SieveResponseStrategy`

#### Returns

`SieveResponseStrategy`

#### Inherited from

`AbstractDotPathResponseStrategy.constructor`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/abstract-dot-path-response.strategy.ts:32](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-dot-path-response.strategy.ts#L32)

Parse a nested-envelope pagination response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response object

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration (dot-notation paths supported)

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Inherited from

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
