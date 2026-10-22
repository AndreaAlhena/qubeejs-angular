---
slug: 3.8/api/classes/payload-request-strategy
title: "PayloadRequestStrategy"
---

Defined in: [src/lib/strategies/payload-request.strategy.ts:55](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/payload-request.strategy.ts#L55)

Request strategy for the Payload CMS driver

Generates URIs in [Payload's REST query format](https://payloadcms.com/docs/queries/overview):
- Filters: `where[field][equals]=value` (multi-value collapses to
  `where[field][in]=v1,v2` CSV)
- Operator filters: `where[field][op]=value` (translated from
  `FilterOperatorEnum` — `BTW`→`greater_than_equal`+`less_than_equal`
  pair, `NOT`→`not_equals`/`not_in`, `NULL`→`exists` with inverted
  boolean)
- Sorts: `sort=-createdAt,title` (CSV, `-` prefix = DESC)
- Field selection (flat): `select[col1]=true&select[col2]=true`
- Pagination (page-based): `page=N&limit=M`

The `where` / `sort` / `select` / `page` / `limit` keys are fixed by
Payload's REST endpoints and intentionally not configurable through
`QueryBuilderOptions`; they live as private statics so they are
visible in one place.

Relationship population is controlled by Payload's numeric `depth`
param, not a named-relation list — `addIncludes` therefore throws
`UnsupportedIncludesError` (pass `depth` through your HTTP layer if
needed). There is no per-model field selection and no global search
param. `SW` (no starts-with operator) and the PostgREST-native
full-text operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
`UnsupportedFilterOperatorError`.

## See

https://payloadcms.com/docs/queries/overview

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new PayloadRequestStrategy**(): `PayloadRequestStrategy`

#### Returns

`PayloadRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/payload-request.strategy.ts:62](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/payload-request.strategy.ts#L62)

Filters, operator filters, sorts, flat field selection (`select`)
— no per-model fields, no includes (numeric `depth` instead), no
global search, no embedded resources

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

> `protected` **parts**(`state`, `_options`): `string`[]

Defined in: [src/lib/strategies/payload-request.strategy.ts:98](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/payload-request.strategy.ts#L98)

Emit Payload-format query-string segments in canonical order:
where (merged) → sort → select → page → limit

Simple filters and operator filters share a single `where` wrapper
so qs emits one ordered bracket structure rather than two duplicate
top-level `where[...]` blocks.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### \_options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (unused;
Payload's wire keys are fixed by the server)

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
