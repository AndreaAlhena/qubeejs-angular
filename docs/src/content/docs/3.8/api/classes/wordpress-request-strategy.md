---
slug: 3.8/api/classes/wordpress-request-strategy
title: "WordpressRequestStrategy"
---

Defined in: [src/lib/strategies/wordpress-request.strategy.ts:38](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/wordpress-request.strategy.ts#L38)

Request strategy for the WordPress REST API driver

Generates URIs in the [WordPress REST API collection format](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/):
- Filters: `field=value` (collection parameters like `status`,
  `author`, `categories`); multi-value folds to a CSV (`field=v1,v2`,
  the list convention WordPress uses for ID params)
- Sorts: `orderby=field&order=asc|desc` — WordPress core supports a
  **single** orderby, so only the first sort rule is emitted
- Field selection (flat): `_fields=id,title` (CSV)
- Relation embedding: `_embed=author,wp:term` (CSV)
- Search: `search=term`
- Pagination (page-based): `page=N&per_page=M`

The `page` / `per_page` / `orderby` / `order` / `search` and the
underscore-prefixed global params (`_fields`, `_embed`) are fixed by
the server and intentionally not configurable through
`QueryBuilderOptions`; they live as private statics so they are
visible in one place.

WordPress caps `per_page` at **100** server-side (a 400
`rest_invalid_param` response beyond that); the cap is endpoint
policy rather than a syntax rule, so `validateLimit` keeps the
default positive-integer check and the server stays authoritative.
There is no generic comparison-operator syntax (only
parameter-specific helpers like `before`/`after` for dates, which
pass through `addFilter`), so `addFilterOperator` throws
`UnsupportedFilterOperatorError` via the capability gate.

## See

https://developer.wordpress.org/rest-api/reference/posts/#list-posts

## Extends

- `AbstractRequestStrategy`

## Constructors

### Constructor

> **new WordpressRequestStrategy**(): `WordpressRequestStrategy`

#### Returns

`WordpressRequestStrategy`

#### Inherited from

`AbstractRequestStrategy.constructor`

## Properties

### capabilities

> `readonly` **capabilities**: `IStrategyCapabilities`

Defined in: [src/lib/strategies/wordpress-request.strategy.ts:45](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/wordpress-request.strategy.ts#L45)

Filters, sorts, global search, flat field selection (`select`),
embedding (`includes`) — no operator filters, no per-model fields,
no embedded-column projection

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

Defined in: [src/lib/strategies/wordpress-request.strategy.ts:80](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/wordpress-request.strategy.ts#L80)

Emit WordPress-format query-string segments in canonical order:
filters → orderby/order → _fields → _embed → search → page → per_page

#### Parameters

##### state

[`IQueryBuilderState`](/3.8/api/interfaces/iquery-builder-state/)

The current query builder state

##### \_options

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)

The query parameter key name configuration (unused;
WordPress' wire keys are fixed by the server)

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
