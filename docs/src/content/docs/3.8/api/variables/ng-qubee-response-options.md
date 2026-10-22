---
slug: 3.8/api/variables/ng-qubee-response-options
title: "NG_QUBEE_RESPONSE_OPTIONS"
---

> `const` **NG\_QUBEE\_RESPONSE\_OPTIONS**: `InjectionToken`\<[`ResponseOptions`](/3.8/api/classes/response-options/)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:50](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/tokens/ng-qubee.tokens.ts#L50)

Injection token for the resolved response field-key options

Provided as a fully-built `ResponseOptions` instance (or a driver-specific
subclass like `JsonApiResponseOptions` / `NestjsResponseOptions`).
`provideNgQubee()` constructs the correct variant from `IConfig.response`.
