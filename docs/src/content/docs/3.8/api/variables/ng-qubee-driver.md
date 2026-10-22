---
slug: 3.8/api/variables/ng-qubee-driver
title: "NG_QUBEE_DRIVER"
---

> `const` **NG\_QUBEE\_DRIVER**: `InjectionToken`\<[`DriverEnum`](/3.8/api/enumerations/driver-enum/)\>

Defined in: [src/lib/tokens/ng-qubee.tokens.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/tokens/ng-qubee.tokens.ts#L16)

Injection token for the active pagination driver

Provided by `provideNgQubee()` / `NgQubeeModule.forRoot()` from the
user-supplied `IConfig.driver`. Services read it to gate driver-specific
behavior (e.g. `NgQubeeService._assertDriver`).
