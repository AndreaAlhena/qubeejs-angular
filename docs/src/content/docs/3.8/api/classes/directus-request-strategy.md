---
slug: 3.8/api/classes/directus-request-strategy
title: "DirectusRequestStrategy"
---

Defined in: [src/lib/strategies/directus-request.strategy.ts:54](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/directus-request.strategy.ts#L54)

Request strategy for the Directus driver

Generates URIs in [Directus' query format](https://docs.directus.io/reference/query.html):
- Filters: `filter[field][_eq]=value` (multi-value collapses to `_in`)
- Operator filters: `filter[field][_op]=value` (translated from
  `FilterOperatorEnum` — `BTW`→`_between`, `SW`→`_starts_with`,
  `ILIKE`→`_icontains`, `NOT`→`_neq`/`_nin`, `NULL`→`_null`/`_nnull`)
- Sorts: `sort=-created_at,name` (CSV, `-` prefix = DESC)
- Field selection / relations: a single `fields=` CSV — flat columns
  from `addSelect`, whole relations from `addIncludes` (`rel.*`), and
  column-projected relations from `addEmbedded` (`rel.col1,rel.col2`)
- Search: `search=term` (global full-text search)
- Metadata: a constant `meta=total_count,filter_count` so responses
  carry the totals the response strategy needs
- Pagination (page-based): `limit=N&page=N`

The `filter` / `sort` / `fields` / `search` / `limit` / `page` keys
honour the existing `QueryBuilderOptions` names (their defaults match
the Directus wire format); `meta` is fixed by the server and lives as
a private static. Directus' `deep[...]` relational query options and
nested relation filtering are out of scope.

PostgREST-native full-text search operators (`FTS`, `PHFTS`, `PLFTS`,
`WFTS`) throw `UnsupportedFilterOperatorError` — use `search` or the
`CONTAINS` / `ILIKE` operator filters instead.

## See

 - https://docs.directus.io/reference/query.html
 - https://docs.directus.io/reference/filter-rules.html

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new DirectusRequestStrategy**(): `DirectusRequestStrategy`

#### Returns

`DirectusRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/directus-request.strategy.ts:62](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/directus-request.strategy.ts#L62)

Filters, operator filters, sorts, flat select, includes and embedded
(both folding into `fields=`), global search — no per-model fields
(Directus scopes relational projections with dot paths, not a
`fields[model]` map)

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

> `protected` **parts**(`state`, `options`): `string`[]

Defined in: [src/lib/strategies/directus-request.strategy.ts:93](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/directus-request.strategy.ts#L93)

Emit Directus-format query-string segments in canonical order:
filter (merged) → sort → fields → search → meta → limit → page

Simple filters and operator filters share a single `filter` wrapper
so qs emits one ordered, deeply-nested bracket structure rather than
two duplicate top-level `filter[...]` blocks.

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
