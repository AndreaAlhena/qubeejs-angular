---
slug: 3.8/api/classes/ng-qubee-service
title: "NgQubeeService"
---

Defined in: [src/lib/services/ng-qubee.service.ts:36](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L36)

## Constructors

### Constructor

> **new NgQubeeService**(`_nestService`, `requestStrategy`, `driver`, `options?`): `NgQubeeService`

Defined in: [src/lib/services/ng-qubee.service.ts:65](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L65)

#### Parameters

##### \_nestService

`NestService`

##### requestStrategy

[`IRequestStrategy`](/3.8/api/interfaces/irequest-strategy/)

##### driver

[`DriverEnum`](/3.8/api/enumerations/driver-enum/)

##### options?

[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/) = `...`

#### Returns

`NgQubeeService`

## Properties

### uri$

> **uri$**: `Observable`\<`string`\>

Defined in: [src/lib/services/ng-qubee.service.ts:61](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L61)

Observable that emits non-empty generated URIs

## Methods

### addEmbedded()

> **addEmbedded**(`relation`, ...`columns`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:115](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L115)

Add an embedded resource to the select statement (PostgREST only)

Splices `relation(col1,col2)` into the single `select=` query
parameter alongside flat columns from `addSelect`. Omit the columns
to project all of them (`relation(*)`):

```
qb.addEmbedded('author', 'id', 'name')
  .addEmbedded('comments')
  .addSelect('title');
// → select=title,author(id,name),comments(*)
```

Calling repeatedly with the same relation merge-dedups the columns.
Does not reset the page (column shape change, not record-set change).

#### Parameters

##### relation

`string`

The related table / foreign-key name as PostgREST sees it

##### columns

...`string`[]

Optional column projection; omit for `relation(*)`

#### Returns

`this`

#### Throws

If the active driver does not support embedded resources

***

### addFields()

> **addFields**(`model`, `fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:131](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L131)

Add fields to the select statement for the given model (JSON:API and Spatie only)

#### Parameters

##### model

`string`

Model that holds the fields

##### fields

`string`[]

Fields to select

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### addFilter()

> **addFilter**(`field`, ...`values`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:153](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L153)

Add a filter with the given value(s) (JSON:API, NestJS, PostgREST, and Spatie)

Produces: `filter[field]=value` (JSON:API / Spatie) or `filter.field=value` (NestJS)

#### Parameters

##### field

`string`

Name of the field to filter

##### values

...(`string` \| `number` \| `boolean`)[]

The needle(s)

#### Returns

`this`

#### Throws

If the active driver does not support filters

***

### addFilterOperator()

> **addFilterOperator**(`field`, `operator`, ...`values`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:179](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L179)

Add a filter with an explicit operator (NestJS and PostgREST)

Produces: `filter.field=$operator:value`

#### Parameters

##### field

`string`

Name of the field to filter

##### operator

[`FilterOperatorEnum`](/3.8/api/enumerations/filter-operator-enum/)

The filter operator to apply

##### values

...(`string` \| `number` \| `boolean`)[]

The value(s) for the filter

#### Returns

`this`

#### Throws

If the active driver does not support filter operators

***

### addIncludes()

> **addIncludes**(...`models`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:199](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L199)

Add related entities to include in the request (JSON:API and Spatie only)

#### Parameters

##### models

...`string`[]

Models to include

#### Returns

`this`

#### Throws

If the active driver does not support includes

***

### addSelect()

> **addSelect**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:220](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L220)

Add flat field selection (NestJS and PostgREST)

Produces: `select=col1,col2`

#### Parameters

##### fields

...`string`[]

Fields to select

#### Returns

`this`

#### Throws

If the active driver does not support flat field selection

***

### addSort()

> **addSort**(`field`, `order`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:240](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L240)

Add a field with a sort criteria (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### field

`string`

Field to use for sorting

##### order

[`SortEnum`](/3.8/api/enumerations/sort-enum/)

A value from the SortEnum enumeration

#### Returns

`this`

#### Throws

If the active driver does not support sorts

***

### currentPage()

> **currentPage**(): `number`

Defined in: [src/lib/services/ng-qubee.service.ts:258](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L258)

Get the current page number

#### Returns

`number`

The current page number

#### Remarks

Always safe to call. Thin accessor over the internal state's `page` field.

***

### deleteEmbedded()

> **deleteEmbedded**(...`relations`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:271](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L271)

Remove embedded resources from the current query builder state (PostgREST only)

Removes the whole relation entry, columns included.

#### Parameters

##### relations

...`string`[]

Relation names to remove

#### Returns

`this`

#### Throws

If the active driver does not support embedded resources

***

### deleteFields()

> **deleteFields**(`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:297](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L297)

Delete selected fields for the given models in the current query builder state (JSON:API and Spatie only)

```
ngQubeeService.deleteFields({
  users: ['email', 'password'],
  address: ['zipcode']
});
```

#### Parameters

##### fields

[`IFields`](/3.8/api/interfaces/ifields/)

Object mapping model names to field arrays to remove

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### deleteFieldsByModel()

> **deleteFieldsByModel**(`model`, ...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:316](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L316)

Delete selected fields for the given model in the current query builder state (JSON:API and Spatie only)

```
ngQubeeService.deleteFieldsByModel('users', 'email', 'password');
```

#### Parameters

##### model

`string`

Model that holds the fields

##### fields

...`string`[]

Fields to delete from the state

#### Returns

`this`

#### Throws

If the active driver does not support per-model field selection

***

### deleteFilters()

> **deleteFilters**(...`filters`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:337](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L337)

Remove given filters from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### filters

...`string`[]

Filters to remove

#### Returns

`this`

#### Throws

If the active driver does not support filters

***

### deleteIncludes()

> **deleteIncludes**(...`includes`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:357](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L357)

Remove selected related models from the query builder state (JSON:API and Spatie only)

#### Parameters

##### includes

...`string`[]

Models to remove

#### Returns

`this`

#### Throws

If the active driver does not support includes

***

### deleteOperatorFilters()

> **deleteOperatorFilters**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:376](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L376)

Remove operator filters by field name (NestJS and PostgREST)

#### Parameters

##### fields

...`string`[]

Field names of operator filters to remove

#### Returns

`this`

#### Throws

If the active driver does not support filter operators

***

### deleteSearch()

> **deleteSearch**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:395](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L395)

Remove search term from the query builder state (NestJS only)

#### Returns

`this`

#### Throws

If the active driver does not support search

***

### deleteSelect()

> **deleteSelect**(...`fields`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:410](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L410)

Remove flat field selections from the query builder state (NestJS and PostgREST)

#### Parameters

##### fields

...`string`[]

Fields to remove from selection

#### Returns

`this`

#### Throws

If the active driver does not support flat field selection

***

### deleteSorts()

> **deleteSorts**(...`sorts`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:429](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L429)

Remove sort rules from the query builder state (JSON:API, NestJS, PostgREST, and Spatie)

#### Parameters

##### sorts

...`string`[]

Fields used for sorting to remove

#### Returns

`this`

#### Throws

If the active driver does not support sorts

***

### firstPage()

> **firstPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:443](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L443)

Navigate to the first page (page 1)

#### Returns

`this`

#### Remarks

Never throws. Idempotent when already on page 1.

***

### generateUri()

> **generateUri**(): `Observable`\<`string`\>

Defined in: [src/lib/services/ng-qubee.service.ts:454](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L454)

Generate a URI accordingly to the given data and active driver

#### Returns

`Observable`\<`string`\>

An observable that emits the generated URI

***

### goToPage()

> **goToPage**(`n`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:474](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L474)

Navigate directly to the specified page

Validates integer/positive via the existing `setPage` path, and
additionally rejects values that exceed `state.lastPage` when
pagination bounds are known.

#### Parameters

##### n

`number`

Target page number

#### Returns

`this`

#### Throws

If `n` is not a positive integer, or if `n > state.lastPage` when `state.isLastPageKnown` is true

***

### hasNextPage()

> **hasNextPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:492](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L492)

Check whether a next page exists

#### Returns

`boolean`

`true` if `state.page < state.lastPage` when bounds are known, or `true` when bounds are unknown

#### Remarks

Template-safe. Returns `true` when pagination bounds are unknown (conservative default — keeps a "Next" button enabled before the first `paginate()` call).

***

### hasPreviousPage()

> **hasPreviousPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:504](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L504)

Check whether a previous page exists

#### Returns

`boolean`

`true` if `state.page > 1`

#### Remarks

Always safe. Does not require a synced paginated response.

***

### isFirstPage()

> **isFirstPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:514](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L514)

Check whether the current page is the first page

#### Returns

`boolean`

`true` if `state.page === 1`

#### Remarks

Always safe. Does not require a synced paginated response.

***

### isLastPage()

> **isLastPage**(): `boolean`

Defined in: [src/lib/services/ng-qubee.service.ts:524](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L524)

Check whether the current page is the last page

#### Returns

`boolean`

`true` only when `state.isLastPageKnown` and `state.page === state.lastPage`

#### Remarks

Template-safe. Returns `false` when pagination bounds are unknown (no paginated response has been synced yet) — keeps "Next" navigation unblocked until the first `paginate()` call syncs.

***

### lastPage()

> **lastPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:537](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L537)

Navigate to the last page known from the most recent paginated response

#### Returns

`this`

#### Remarks

Requires at least one `PaginationService.paginate()` call to have synced `state.lastPage`. Before that, the bound is unknown and this method throws.

#### Throws

If `state.isLastPageKnown` is false (no paginated response has been synced yet)

***

### nextPage()

> **nextPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:555](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L555)

Navigate to the next page

#### Returns

`this`

#### Remarks

Never throws. Idempotent at the known last page (no-op). Pair with `hasNextPage()` for a disable-state binding.

***

### paginationHeaders()

> **paginationHeaders**(): `Record`\<`string`, `string`\> \| `null`

Defined in: [src/lib/services/ng-qubee.service.ts:579](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L579)

HTTP request headers the active driver wants the consumer to apply

Returns `null` for drivers that pass all pagination metadata on the
URL (Laravel, Spatie, JSON:API, NestJS, and PostgREST in its default
QUERY mode). Returns a map of header name → value when the active
driver uses HTTP headers instead — today, only the PostgREST driver
configured with `PaginationModeEnum.RANGE`, which yields
`{ 'Range-Unit': 'items', 'Range': 'from-to' }`.

#### Returns

`Record`\<`string`, `string`\> \| `null`

Map of headers to apply to the HTTP request, or `null` when not needed

***

### previousPage()

> **previousPage**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:593](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L593)

Navigate to the previous page

#### Returns

`this`

#### Remarks

Never throws. Idempotent at page 1 (floored). Pair with `hasPreviousPage()` for a disable-state binding.

***

### reset()

> **reset**(): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:610](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L610)

Clear the current state and reset the Query Builder to a fresh, clean condition

#### Returns

`this`

***

### setBaseUrl()

> **setBaseUrl**(`baseUrl`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:622](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L622)

Set the base URL to use for composing the address

#### Parameters

##### baseUrl

`string`

The base URL

#### Returns

`this`

***

### setLimit()

> **setLimit**(`limit`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:640](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L640)

Set the items per page number

Validation is delegated to the active request strategy because the
accepted range is driver-specific: nestjs-paginate additionally accepts
`-1` as a "fetch all" sentinel, while Laravel, Spatie, and JSON:API
require a positive integer.

#### Parameters

##### limit

`number`

Number of items per page (or `-1` to fetch all, NestJS only)

#### Returns

`this`

#### Throws

If the value is not accepted by the active driver

***

### setPage()

> **setPage**(`page`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:654](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L654)

Set the page that the backend will use to paginate the result set

#### Parameters

##### page

`number`

Page number

#### Returns

`this`

***

### setResource()

> **setResource**(`resource`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:666](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L666)

Set the API resource to run the query against

#### Parameters

##### resource

`string`

Resource name (e.g. 'users' produces /users)

#### Returns

`this`

***

### setSearch()

> **setSearch**(`search`): `this`

Defined in: [src/lib/services/ng-qubee.service.ts:682](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L682)

Set the search term for full-text search (NestJS only)

Produces: `search=term`

#### Parameters

##### search

`string`

The search term

#### Returns

`this`

#### Throws

If the active driver does not support search

***

### totalPages()

> **totalPages**(): `number`

Defined in: [src/lib/services/ng-qubee.service.ts:697](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/services/ng-qubee.service.ts#L697)

Get the total number of pages reported by the most recent paginated response

#### Returns

`number`

The last page number

#### Remarks

Throws when called before any `paginate()` has synced a value. For a non-throwing read in a template, read `nest().isLastPageKnown` first as a guard.

#### Throws

If `state.isLastPageKnown` is false (no paginated response has been synced yet)
