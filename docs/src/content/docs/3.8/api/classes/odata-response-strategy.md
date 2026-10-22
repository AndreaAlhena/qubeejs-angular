---
slug: 3.8/api/classes/odata-response-strategy
title: "OdataResponseStrategy"
---

Defined in: [src/lib/strategies/odata-response.strategy.ts:40](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/odata-response.strategy.ts#L40)

Response strategy for the OData v4 driver

Parses OData collection responses:

```json
{
  "@odata.context": "https://api.example.com/$metadata#Products",
  "@odata.count": 100,
  "@odata.nextLink": "https://api.example.com/Products?$count=true&$top=10&$skip=30",
  "value": [...]
}
```

OData emits no current-page or page-size field in the body, so this
strategy **derives** them by inspecting the `@odata.nextLink` URL:

- `perPage` comes from the link's `$top` param, falling back to the
  item count of the current (necessarily full) page when the link
  carries no `$top`.
- `currentPage` is `$skip ÷ perPage` — the next page starts where the
  current one ends. Without a usable link (`$skiptoken`-based
  server-driven paging, or the last page) the strategy falls back to
  page **1**, which is only guaranteed correct for single-page results.
- `lastPage` is `ceil(total ÷ perPage)`; on a link-less response it
  resolves to 1 when the page provably holds the whole result set.

The total requires `$count=true` on the request — the request strategy
always emits it. Envelope keys contain **literal dots** (`@odata.count`),
so key paths from `OdataResponseOptions` are read with flat bracket
access, never dot-path traversal.

## See

https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html

## Implements

- [`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/)

## Constructors

### Constructor

> **new OdataResponseStrategy**(): `OdataResponseStrategy`

#### Returns

`OdataResponseStrategy`

## Methods

### paginate()

> **paginate**\<`T`\>(`response`, `options`): [`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

Defined in: [src/lib/strategies/odata-response.strategy.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/strategies/odata-response.strategy.ts#L50)

Parse an OData collection response into a PaginatedCollection

#### Type Parameters

##### T

`T` *extends* [`IPaginatedObject`](/3.8/api/interfaces/ipaginated-object/)

#### Parameters

##### response

`Record`\<`string`, `any`\>

The raw API response body

##### options

[`ResponseOptions`](/3.8/api/classes/response-options/)

The response key name configuration

#### Returns

[`PaginatedCollection`](/3.8/api/classes/paginated-collection/)\<`T`\>

A typed PaginatedCollection instance

#### Implementation of

[`IResponseStrategy`](/3.8/api/interfaces/iresponse-strategy/).[`paginate`](/3.8/api/interfaces/iresponse-strategy/#paginate)
