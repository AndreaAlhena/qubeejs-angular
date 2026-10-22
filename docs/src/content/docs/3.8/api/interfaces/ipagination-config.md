---
slug: 3.8/api/interfaces/ipagination-config
title: "IPaginationConfig"
---

Defined in: [src/lib/interfaces/pagination-config.interface.ts:10](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L10)

Configuration interface for customizing response field key names

Each property maps a logical pagination concept to the actual key name
used in the API response. The defaults depend on the selected driver.

For the NestJS driver, dot-notation paths are used to access nested values
(e.g., 'meta.currentPage', 'links.next').

## Properties

### currentPage?

> `optional` **currentPage?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:12](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L12)

Key for the current page number (Laravel: 'current_page', NestJS: 'meta.currentPage')

***

### data?

> `optional` **data?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:14](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L14)

Key for the data array (default: 'data')

***

### firstPageUrl?

> `optional` **firstPageUrl?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L16)

Key for the first page URL (Laravel: 'first_page_url', NestJS: 'links.first')

***

### from?

> `optional` **from?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:18](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L18)

Key for the "from" item index (Laravel: 'from', NestJS: computed)

***

### lastPage?

> `optional` **lastPage?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:20](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L20)

Key for the last page number (Laravel: 'last_page', NestJS: 'meta.totalPages')

***

### lastPageUrl?

> `optional` **lastPageUrl?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:22](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L22)

Key for the last page URL (Laravel: 'last_page_url', NestJS: 'links.last')

***

### nextPageUrl?

> `optional` **nextPageUrl?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:24](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L24)

Key for the next page URL (Laravel: 'next_page_url', NestJS: 'links.next')

***

### path?

> `optional` **path?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:26](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L26)

Key for the base path (Laravel only, default: 'path')

***

### perPage?

> `optional` **perPage?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:28](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L28)

Key for items per page (Laravel: 'per_page', NestJS: 'meta.itemsPerPage')

***

### prevPageUrl?

> `optional` **prevPageUrl?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:30](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L30)

Key for the previous page URL (Laravel: 'prev_page_url', NestJS: 'links.previous')

***

### to?

> `optional` **to?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:32](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L32)

Key for the "to" item index (Laravel: 'to', NestJS: computed)

***

### total?

> `optional` **total?**: `string`

Defined in: [src/lib/interfaces/pagination-config.interface.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/pagination-config.interface.ts#L34)

Key for the total item count (Laravel: 'total', NestJS: 'meta.totalItems')
