---
slug: 3.8/api/classes/spring-response-strategy
title: "SpringResponseStrategy"
---

Defined in: [src/lib/strategies/spring-response.strategy.ts:40](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/spring-response.strategy.ts#L40)

Response strategy for the Spring Data REST driver

Parses Spring Data REST's HAL envelope:
```json
{
  "_embedded": { "users": [{ "id": 1, "name": "John" }] },
  "_links": {
    "first": { "href": "..." },
    "prev": { "href": "..." },
    "next": { "href": "..." },
    "last": { "href": "..." }
  },
  "page": { "size": 20, "totalElements": 100, "totalPages": 5, "number": 1 }
}
```

Two HAL quirks are absorbed here on top of the inherited dot-path
traversal:

- **`page.number` is 0-indexed** — the strategy adds 1 so the library
  state stays 1-indexed (mirroring `SpringRequestStrategy`, which
  subtracts 1 on the way out).
- **The collection key under `_embedded` is the resource rel name**
  (e.g. `_embedded.users`), which cannot be known statically. The
  default `data` path is plain `_embedded`; when it resolves to an
  object rather than an array, the strategy picks the first array
  value inside it. Consumers with multiple embedded rels can pin the
  exact path via `IConfig.response` (e.g. `data: '_embedded.users'`).

Default key paths are configured in `SpringResponseOptions`.

## See

https://docs.spring.io/spring-data/rest/reference/paging-and-sorting.html

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new SpringResponseStrategy**(): `SpringResponseStrategy`

#### Returns

`SpringResponseStrategy`

#### Inherited from

`AbstractDotPathResponseStrategy.constructor`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/spring-response.strategy.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/spring-response.strategy.ts#L50)

Parse a Spring Data REST HAL response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response body

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

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
