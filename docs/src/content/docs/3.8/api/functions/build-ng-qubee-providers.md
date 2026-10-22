---
slug: 3.8/api/functions/build-ng-qubee-providers
title: "buildNgQubeeProviders"
---

> **buildNgQubeeProviders**(`config`): `Provider`[]

Defined in: [src/lib/provide-ngqubee.ts:34](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/provide-ngqubee.ts#L34)

Build the core provider list shared by `provideNgQubee()` and
`NgQubeeModule.forRoot()`

Looks up the driver definition from the registry and calls its three
factories — request strategy, response strategy, response options.
Adding a driver means adding one entry to `DRIVERS`; this function
does not change.

Exposes the driver, strategies, and options via injection tokens so that
consumers can request a component-scoped instance of the services through
`provideNgQubeeInstance()`.

## Parameters

### config

[`IConfig`](/3.8/api/interfaces/iconfig/)

Configuration object compliant to the IConfig interface

## Returns

`Provider`[]

An array of Providers for the environment injector
