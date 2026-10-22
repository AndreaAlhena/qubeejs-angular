---
slug: 3.8/api/classes/pocketbase-request-strategy
title: "PocketbaseRequestStrategy"
---

Defined in: [src/lib/strategies/pocketbase-request.strategy.ts:41](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/pocketbase-request.strategy.ts#L41)

Request strategy for the PocketBase driver

Generates URIs in [PocketBase's records-list format](https://pocketbase.io/docs/api-records/):
- Filters: a single `filter=(...)` expression-language parameter —
  simple single-value filters fold to `field='value'`, multi-value
  filters fold to an OR group (`(field='v1' || field='v2')`), and all
  clauses join with ` && `
- Operator filters: expression terms (`field>=10`, `field~'val'`) —
  see the mapping on `_formatOperatorClause`
- Sorts: `sort=-created,title` (CSV, `-` prefix = DESC)
- Field selection (flat): `fields=id,title` (CSV)
- Relation expansion: `expand=author,comments` (CSV)
- Pagination (page-based): `page=N&perPage=M`

The `page` / `perPage` / `sort` / `filter` / `expand` / `fields` keys
are fixed by the PocketBase records API and intentionally not
configurable through `QueryBuilderOptions`; they live as private
statics so they are visible in one place.

String literals are single-quoted with embedded quotes
backslash-escaped (`name='O\'Brien'`); numbers and booleans emit
bare. PocketBase has no global search param (use `~` terms instead)
and no per-model field selection — the corresponding fluent methods
throw the matching `Unsupported*Error`. The PostgREST-native
full-text operators (`FTS`, `PHFTS`, `PLFTS`, `WFTS`) throw
`UnsupportedFilterOperatorError`.

## See

https://pocketbase.io/docs/api-records/

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new PocketbaseRequestStrategy**(): `PocketbaseRequestStrategy`

#### Returns

`PocketbaseRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/pocketbase-request.strategy.ts:48](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/pocketbase-request.strategy.ts#L48)

Filters, operator filters, sorts, expand (`includes`), flat field
selection (`select`) — no per-model fields, no global search, no
embedded resources

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

Defined in: [src/lib/strategies/pocketbase-request.strategy.ts:86](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/pocketbase-request.strategy.ts#L86)

Emit PocketBase-format query-string segments in canonical order:
expand → fields → filter (merged) → sort → page → perPage

Simple filters and operator filters share the single `filter=(...)`
parameter so the server receives one combined expression rather
than two conflicting `filter` params.

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### \_options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (unused;
PocketBase's wire keys are fixed by the server)

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
