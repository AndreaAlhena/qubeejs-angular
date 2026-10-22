---
slug: 3.8/api/classes/postgrest-request-strategy
title: "PostgrestRequestStrategy"
---

Defined in: [src/lib/strategies/postgrest-request.strategy.ts:31](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-request.strategy.ts#L31)

Request strategy for the PostgREST driver

PostgREST auto-generates REST APIs from PostgreSQL schemas and is the
backbone of Supabase's data API. This strategy produces URIs in
PostgREST's native query-string format:

- Filters: `col=eq.val` (single value) / `col=in.(v1,v2,v3)` (multi-value)
- Order: `order=col1.asc,col2.desc`
- Select: `select=col1,col2`
- Pagination: `limit=N&offset=M` (offset derived from state.page)

The `order` and `offset` query-parameter names are PostgREST conventions
and are intentionally not configurable via `QueryBuilderOptions` (see
issue #50 MVP scope). `limit`, `select`, and `filters` (per-column name)
honour the existing option keys.

## See

 - https://postgrest.org/en/stable/api.html
 - https://supabase.com/docs/reference/javascript/select

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new PostgrestRequestStrategy**(`paginationMode?`): `PostgrestRequestStrategy`

Defined in: [src/lib/strategies/postgrest-request.strategy.ts:66](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-request.strategy.ts#L66)

#### Parameters

##### paginationMode?

[`PaginationModeEnum`](/3.8/api/enumerations/pagination-mode-enum/) = `PaginationModeEnum.QUERY`

Wire-level pagination mechanism. Defaults to
`PaginationModeEnum.QUERY`; `provideNgQubee` wires this from
`IConfig.pagination`.

#### Returns

`PostgrestRequestStrategy`

#### Overrides

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/postgrest-request.strategy.ts:38](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-request.strategy.ts#L38)

Filters, operator filters (incl. FTS), sorts, flat select — no
per-model fields, no JSON:API/Spatie-style includes, no global
search (per-column FTS via the operator family covers it)

#### Overrides

`AbstractRequestStrategy.capabilities`

## Methods

### assertResource()

> `protected` **assertResource**(`state`): `void`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:89](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L89)

Throw if the resource is not set on the state

Centralises the message that was previously copy-pasted across four
of the five concrete strategies.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`void`

#### Throws

Error if `state.resource` is empty

#### Inherited from

`AbstractRequestStrategy.assertResource`

***

### baseUri()

> `protected` **baseUri**(`state`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:101](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L101)

Compute the base path (no query string)

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`string`

The base URI without the query separator (e.g. `/users` or `https://api.example.com/users`)

#### Inherited from

`AbstractRequestStrategy.baseUri`

***

### buildPaginationHeaders()

> **buildPaginationHeaders**(`state`): `Record`\<`string`, `string`\> \| `null`

Defined in: [src/lib/strategies/postgrest-request.strategy.ts:83](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-request.strategy.ts#L83)

Compute `Range-Unit` / `Range` HTTP headers for RANGE pagination mode

In QUERY mode this returns `null` so `NgQubeeService.paginationHeaders()`
conveys "no headers needed" to the consumer. In RANGE mode the method
converts the 1-indexed `state.page` + `state.limit` into PostgREST's
0-indexed inclusive range (`from = (page - 1) * limit`,
`to = from + limit - 1`) and returns both header values.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

#### Returns

`Record`\<`string`, `string`\> \| `null`

`{ 'Range-Unit': 'items', 'Range': 'from-to' }` or `null`

***

### buildUri()

> **buildUri**(`state`, `options`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:42](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L42)

Compose the full request URI from the given state

Template method: validates the resource, computes the base path,
delegates the per-driver query-string segments to `parts(...)`, and
joins them with the conventional `?`/`&` separators.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration

#### Returns

`string`

The composed URI string

#### Throws

Error if the resource is not set

#### Inherited from

`AbstractRequestStrategy.buildUri`

***

### join()

> `protected` **join**(`base`, `segments`): `string`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:115](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L115)

Glue the base URI and the per-driver query-string segments

Returns the bare base when no segments were emitted (e.g. PostgREST
in RANGE mode with no filters), otherwise joins with `?` + `&`.

#### Parameters

##### base

`string`

The base URI from `_baseUri`

##### segments

`string`[]

The query-string fragments from `parts(...)`

#### Returns

`string`

The full URI

#### Inherited from

`AbstractRequestStrategy.join`

***

### parts()

> `protected` **parts**(`state`, `options`): `string`[]

Defined in: [src/lib/strategies/postgrest-request.strategy.ts:108](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/postgrest-request.strategy.ts#L108)

Emit PostgREST-format query-string segments in canonical order:
filters → operator filters → order → select → (limit + offset in
QUERY mode only — RANGE mode passes pagination via headers instead)

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration

#### Returns

`string`[]

Ordered query-string fragments

#### Overrides

`AbstractRequestStrategy.parts`

***

### validateLimit()

> **validateLimit**(`limit`): `void`

Defined in: [src/lib/strategies/abstract-request.strategy.ts:59](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/abstract-request.strategy.ts#L59)

Validate that a limit value is acceptable for this driver

Default policy: positive integer. Drivers that recognise a sentinel
(NestJS treats `-1` as "fetch all") override this method.

#### Parameters

##### limit

`number`

The limit value to validate

#### Returns

`void`

#### Throws

If the value is not a positive integer

#### Inherited from

`AbstractRequestStrategy.validateLimit`
