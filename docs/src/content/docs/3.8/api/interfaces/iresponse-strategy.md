---
slug: 3.8/api/interfaces/iresponse-strategy
title: "IResponseStrategy"
---

Defined in: [src/lib/interfaces/response-strategy.interface.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/response-strategy.interface.ts#L12)

Strategy interface for parsing paginated API responses

Each driver implements this interface to parse responses
from the corresponding backend format into a PaginatedCollection.

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`, `headers?`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/interfaces/response-strategy.interface.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/response-strategy.interface.ts#L26)

Parse a raw API response into a typed PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `unknown`\>

The raw API response object (body). For drivers that
emit a bare array body (e.g. PostgREST), pass the array here.

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

##### headers?

[`HeaderBag`](/3.8/api/type-aliases/header-bag/)

Optional HTTP response headers. Drivers that carry
pagination metadata in headers (PostgREST's `Content-Range`) read from
this bag; body-only drivers ignore it. Accepts anything with a `.get()`
accessor (`HttpHeaders`, `Headers`) or a plain `Record<string, string>`.

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance
