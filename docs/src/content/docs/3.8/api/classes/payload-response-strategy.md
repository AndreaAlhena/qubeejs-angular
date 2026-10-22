---
slug: 3.8/api/classes/payload-response-strategy
title: "PayloadResponseStrategy"
---

Defined in: [src/lib/strategies/payload-response.strategy.ts:38](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/payload-response.strategy.ts#L38)

Response strategy for the Payload CMS driver

Parses Payload's paginated collection responses — the
`mongoose-paginate-v2` envelope, shared by many Express/Mongoose
backends:
```json
{
  "docs": [{ "id": "abc123", "title": "Hello" }],
  "totalDocs": 48,
  "limit": 10,
  "totalPages": 5,
  "page": 2,
  "pagingCounter": 11,
  "hasPrevPage": true,
  "hasNextPage": true,
  "prevPage": 1,
  "nextPage": 3
}
```

Default key paths are configured in `PayloadResponseOptions`. The
envelope's `pagingCounter` is the 1-indexed offset of the first doc
on the page, so it maps straight onto `from`; `to` is computed from
`page` × `limit` (clamped to the total). `prevPage` / `nextPage` are
**page numbers**, not URLs, so the navigation-URL slots on
`PaginatedCollection` stay `undefined` unless the consumer overrides
their paths via `IPaginationConfig`. The traversal algorithm is
inherited from `AbstractDotPathResponseStrategy`; this class exists
so `DriverEnum.PAYLOAD` resolves to a distinct identity at the DI
layer even though the parsing logic is shared with JSON:API, NestJS,
Strapi, and PocketBase.

## See

https://payloadcms.com/docs/rest-api/overview

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new PayloadResponseStrategy**(): `PayloadResponseStrategy`

#### Returns

`PayloadResponseStrategy`

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
