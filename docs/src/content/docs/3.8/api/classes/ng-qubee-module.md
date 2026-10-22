---
slug: 3.8/api/classes/ng-qubee-module
title: "NgQubeeModule"
---

Defined in: [src/lib/ng-qubee.module.ts:8](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/ng-qubee.module.ts#L8)

## Constructors

### Constructor

> **new NgQubeeModule**(): `NgQubeeModule`

#### Returns

`NgQubeeModule`

## Methods

### forRoot()

> `static` **forRoot**(`config`): `ModuleWithProviders`\<`NgQubeeModule`\>

Defined in: [src/lib/ng-qubee.module.ts:16](https://github.com/AndreaAlhena/ng-qubee/blob/9715c40042e230894b0ee15df24504f264259da0/src/lib/ng-qubee.module.ts#L16)

Configure NgQubee for the root module

#### Parameters

##### config

[`IConfig`](/3.8/api/interfaces/iconfig/)

Configuration object with driver, and optional request and response settings

#### Returns

`ModuleWithProviders`\<`NgQubeeModule`\>

Module with providers configured for the specified driver
