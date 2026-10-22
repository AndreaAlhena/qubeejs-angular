---
slug: 3.8/api/variables/ng-qubee-request-options
title: "NG_QUBEE_REQUEST_OPTIONS"
---

> `const` **NG\_QUBEE\_REQUEST\_OPTIONS**: `InjectionToken`\<[`QueryBuilderOptions`](/3.8/api/classes/query-builder-options/)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:33](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/tokens/ng-qubee.tokens.ts#L33)

Injection token for the resolved request query-parameter key options

Provided as a fully-built `QueryBuilderOptions` instance. `provideNgQubee()`
constructs it from `IConfig.request`; consumers don't interact with this
token directly.
