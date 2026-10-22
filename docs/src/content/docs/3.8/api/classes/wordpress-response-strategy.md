---
slug: 3.8/api/classes/wordpress-response-strategy
title: "WordpressResponseStrategy"
---

Defined in: [src/lib/strategies/wordpress-response.strategy.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/wordpress-response.strategy.ts#L50)

Response strategy for the WordPress REST API driver

WordPress returns a bare array body for collection endpoints.
Pagination metadata travels in HTTP response headers:

- `X-WP-Total` — total number of records in the collection
- `X-WP-TotalPages` — total number of pages at the requested
  `per_page`
- `Link` — RFC 5988 navigation links (`rel="next"` / `rel="prev"`)

The strategy surfaces the `Link` URLs as `nextPageUrl` /
`prevPageUrl` and derives position from them:

- `currentPage` is the `prev` link's `page` param + 1 (no `prev` →
  page **1**), falling back to the `next` link's `page` param − 1.
- `perPage` is the item count of the current page whenever a `next`
  link exists (a page with a successor is necessarily full); on the
  last page of a multi-page set it is not introspectable and stays
  `undefined`.
- `from`/`to` derive from `currentPage` × `perPage` on full pages,
  or count back from the total on the last page
  (`from = total - data.length + 1`, `to = total`).

This strategy expects the consumer to pass the array body as
`response` (or a plain object with `response[options.data]` pointing
at the array) and the response headers via the optional `headers`
bag — the same call-site shape as the PostgREST driver. Omitted
headers are tolerated and yield a collection with `undefined`
bounds.

## See

https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/

## Implements

- [`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/)

## Constructors

### Constructor

> **new WordpressResponseStrategy**(): `WordpressResponseStrategy`

#### Returns

`WordpressResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`, `headers?`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/wordpress-response.strategy.ts:70](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/wordpress-response.strategy.ts#L70)

Parse a WordPress REST response into a typed PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `unknown`\>

The raw response. Either the array body directly, or
an object with the array at `response[options.data]`.

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key configuration (only `options.data` is
consulted; all pagination metadata comes from headers).

##### headers?

[`HeaderBag`](/3.8/api/type-aliases/header-bag/)

Optional HTTP response headers. `X-WP-Total` /
`X-WP-TotalPages` drive the totals and the `Link` header drives
navigation and page derivation; omission is tolerated.

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/).[`paginate`](/3.8/api/interfaces/iresponse-strategy/#paginate)
