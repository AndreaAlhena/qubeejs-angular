---
slug: 3.8/api/classes/postgrest-response-strategy
title: "PostgrestResponseStrategy"
---

Defined in: [src/lib/strategies/postgrest-response.strategy.ts:35](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-response.strategy.ts#L35)

Response strategy for the PostgREST driver

PostgREST (and Supabase, which wraps it) returns a bare array body for
collection endpoints. Pagination metadata is carried in the
`Content-Range` HTTP response header, e.g. `0-9/50` meaning "items 0–9
out of 50 total". Consumers opt into totals by sending the
`Prefer: count=exact` request header.

This strategy expects the consumer to pass the array body as `response`
(or a plain object with `response[options.data]` pointing at the array)
and the response headers via the optional `headers` bag. See
`PaginationService.paginate()` for the call-site shape.

## See

https://postgrest.org/en/stable/references/api/pagination_count.html

## Implements

- [`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/)

## Constructors

### Constructor

> **new PostgrestResponseStrategy**(): `PostgrestResponseStrategy`

#### Returns

`PostgrestResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`, `headers?`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/postgrest-response.strategy.ts:53](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-response.strategy.ts#L53)

Parse a PostgREST response into a typed PaginatedCollection

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
consulted; all pagination metadata comes from the Content-Range header).

##### headers?

[`HeaderBag`](/3.8/api/type-aliases/header-bag/)

Optional HTTP response headers. The `Content-Range`
header drives page/total derivation; omission is tolerated and yields
a collection with `undefined` bounds (auto-sync will leave
`isLastPageKnown` at `false`).

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/).[`paginate`](/3.8/api/interfaces/iresponse-strategy/#paginate)
