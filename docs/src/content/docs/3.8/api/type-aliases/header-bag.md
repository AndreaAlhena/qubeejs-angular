---
slug: 3.8/api/type-aliases/header-bag
title: "HeaderBag"
---

> **HeaderBag** = \{ `get`: `string` \| `null`; \} \| `Record`\<`string`, `string` \| `null` \| `undefined`\>

Defined in: [src/lib/interfaces/header-bag.interface.ts:9](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/interfaces/header-bag.interface.ts#L9)

A minimal bag of HTTP response headers that a response strategy can read
by name.

Accepts anything that exposes a `.get(name): string | null` method
(Angular's `HttpHeaders`, the DOM `Headers` class) or a plain object
keyed by header name. Consumers should not need to convert between them.
