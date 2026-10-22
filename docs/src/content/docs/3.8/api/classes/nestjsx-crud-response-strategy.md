---
slug: 3.8/api/classes/nestjsx-crud-response-strategy
title: "NestjsxCrudResponseStrategy"
---

Defined in: [src/lib/strategies/nestjsx-crud-response.strategy.ts:36](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/nestjsx-crud-response.strategy.ts#L36)

Response strategy for the @nestjsx/crud driver

Parses @nestjsx/crud's `getMany` envelope:
```json
{
  "data": [{ "id": 1, "name": "John" }],
  "count": 10,
  "total": 48,
  "page": 2,
  "pageCount": 5
}
```

Default key paths are configured in `NestjsxCrudResponseOptions`. The
envelope carries no `from`/`to` indices and no navigation links, so
`from`/`to` are computed from `page` × `count` by the inherited
traversal algorithm and the URL slots resolve to `undefined` unless
the consumer overrides their paths via `IPaginationConfig`.

Note that `count` is the number of entities **on the current page**,
not the requested page size — on the last page of a result set the
derived `from`/`to` can underestimate. Consumers needing exact
indices should compute them from the requested limit instead.

The dot-notation traversal is inherited from
`AbstractDotPathResponseStrategy`; this class exists so
`DriverEnum.NESTJSX_CRUD` resolves to a distinct identity at the DI
layer even though the parsing logic is shared with JSON:API, NestJS,
and Strapi.

## See

https://github.com/nestjsx/crud/wiki/Requests

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new NestjsxCrudResponseStrategy**(): `NestjsxCrudResponseStrategy`

#### Returns

`NestjsxCrudResponseStrategy`

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
