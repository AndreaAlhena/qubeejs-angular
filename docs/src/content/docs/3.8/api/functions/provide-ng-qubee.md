---
slug: 3.8/api/functions/provide-ng-qubee
title: "provideNgQubee"
---

> **provideNgQubee**(`config`): `EnvironmentProviders`

Defined in: [src/lib/provide-ngqubee.ts:97](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/provide-ngqubee.ts#L97)

Sets up providers necessary to enable `NgQubee` functionality for the application.

## Parameters

### config

[`IConfig`](/3.8/api/interfaces/iconfig/)

Configuration object compliant to the IConfig interface

## Returns

`EnvironmentProviders`

A set of providers to setup NgQubee

## Usage Notes

Basic example with the Laravel driver:
```
bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.LARAVEL })]
});
```

Spatie driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.SPATIE })]
});
```

JSON:API driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.JSON_API })]
});
```

NestJS driver example:
```
import { DriverEnum } from 'ng-qubee';

bootstrapApplication(AppComponent, {
  providers: [provideNgQubee({ driver: DriverEnum.NESTJS })]
});
```

## Public Api
