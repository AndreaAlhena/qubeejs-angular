---
slug: 3.8/api/classes/pagination-service
title: "PaginationService"
---

Defined in: [src/lib/services/pagination.service.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/pagination.service.ts#L12)

## Constructors

### Constructor

> **new PaginationService**(`nestService`, `responseStrategy`, `options?`): `PaginationService`

Defined in: [src/lib/services/pagination.service.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/pagination.service.ts#L31)

#### Parameters

##### nestService

`NestService`

##### responseStrategy

[`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/)

##### options?

[`ResponseOptions`](/3.8/api/classes/response-options/) = `...`

#### Returns

`PaginationService`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `headers?`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/services/pagination.service.ts:63](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/pagination.service.ts#L63)

Transform a raw API response into a typed PaginatedCollection

Delegates to the active driver's response strategy for parsing, then
auto-syncs the parsed `page` and `lastPage` back into `NestService`
so pagination navigation helpers on `NgQubeeService` can operate
against the live server-reported bounds without consumer bookkeeping.

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

The raw API response body. For drivers that emit a
bare array (PostgREST), pass the array.

##### headers?

[`HeaderBag`](/3.8/api/type-aliases/header-bag/)

Optional HTTP response headers. Required by the
PostgREST driver (reads `Content-Range` for pagination metadata);
body-only drivers ignore it. Accepts Angular's `HttpHeaders`, the
native `Headers` class, or a plain `Record<string, string>`.

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Remarks

`lastPage` is only synced when the response yields a positive integer.
Server-emitted `0` (empty collection edge case) and absent fields are
treated as "no useful info" and leave `isLastPageKnown: false`.
