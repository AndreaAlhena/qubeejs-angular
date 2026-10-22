---
slug: 3.8/api/classes/api-platform-response-strategy
title: "ApiPlatformResponseStrategy"
---

Defined in: [src/lib/strategies/api-platform-response.strategy.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/api-platform-response.strategy.ts#L50)

Response strategy for the API Platform (Symfony) driver

Parses API Platform's default Hydra/JSON-LD collection envelope:

```json
{
  "@context": "/contexts/Book",
  "@type": "hydra:Collection",
  "hydra:totalItems": 48,
  "hydra:member": [...],
  "hydra:view": {
    "@id": "/books?page=3&itemsPerPage=10",
    "hydra:first": "/books?page=1",
    "hydra:previous": "/books?page=2",
    "hydra:next": "/books?page=4",
    "hydra:last": "/books?page=5"
  }
}
```

The Hydra keys contain colons but no dots, so the inherited
dot-notation resolver traverses them cleanly (`hydra:view.hydra:next`
→ `response['hydra:view']['hydra:next']`). The body names no
current-page or page-size field, so both are **derived from the
`hydra:view` URLs**:

- `currentPage` from the `page` param of the view's `@id` (the
  `path` option slot points there); missing view → page **1**.
- `perPage` from the `itemsPerPage` param of the view's `@id`
  (echoed whenever the request set it — this driver's request
  strategy always does), falling back to the item count of a page
  that has a `hydra:next` successor.
- `lastPage` from the `page` param of `hydra:last`, falling back to
  `ceil(total ÷ perPage)`; a view-less response holding the whole
  collection resolves to 1.

URLs are typically **relative** (`/books?page=4`) — parsing retries
against a placeholder base, and the links are surfaced as-is on the
collection. JSON:API and HAL serialization formats are out of scope
(use the JSON:API driver for the former).

## See

https://api-platform.com/docs/core/pagination/

## Extends

- `AbstractDotPathResponseStrategy`

## Constructors

### Constructor

> **new ApiPlatformResponseStrategy**(): `ApiPlatformResponseStrategy`

#### Returns

`ApiPlatformResponseStrategy`

#### Inherited from

`AbstractDotPathResponseStrategy.constructor`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/api-platform-response.strategy.ts:60](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/api-platform-response.strategy.ts#L60)

Parse a Hydra collection response into a PaginatedCollection

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
