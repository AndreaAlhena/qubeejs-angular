---
slug: 3.8/api/functions/read-header
title: "readHeader"
---

> **readHeader**(`bag`, `name`): `string` \| `null`

Defined in: [src/lib/interfaces/header-bag.interface.ts:21](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/header-bag.interface.ts#L21)

Read a header value by name from a `HeaderBag`, regardless of whether the
bag exposes a `.get()` accessor or plain property access.

## Parameters

### bag

[`HeaderBag`](/3.8/api/type-aliases/header-bag/) \| `null` \| `undefined`

The header bag to read from

### name

`string`

The header name (case-sensitivity follows the underlying bag)

## Returns

`string` \| `null`

The header value, or `null` if absent or the bag itself is falsy
