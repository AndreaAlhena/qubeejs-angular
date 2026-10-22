import { InjectionToken } from '@angular/core';

import type {
  DriverDefinition,
  IRequestStrategy,
  IResponseStrategy,
  QueryBuilderOptions,
  ResponseOptions
} from '@qubeejs/core';

import type { QubeeListAdapter } from '../types/qubee-list-adapter.type';

/**
 * Injection token for the base URL every generated URI starts with
 *
 * Provided by `provideQubee()` / `QubeeModule.forRoot()` from
 * `QubeeConfig.baseUrl`; empty when the config names none. Each
 * `QubeeSignalStore` starts from it, as the core's `createQubee()` does, so
 * `setBaseUrl()` overrides it for one instance and `reset()` clears it.
 */
export const QUBEE_BASE_URL = new InjectionToken<string>('QUBEE_BASE_URL', { factory: () => '' });

/**
 * Injection token for the active driver definition
 *
 * Provided by `provideQubee()` / `QubeeModule.forRoot()` from the
 * user-supplied `QubeeConfig.driver` — `STRAPI_DRIVER`, say. Read
 * `.id` for the driver's identifier (`'strapi'`).
 */
export const QUBEE_DRIVER = new InjectionToken<DriverDefinition>('QUBEE_DRIVER');

/**
 * Injection token for the resolved request URI strategy
 *
 * Provided by `provideQubee()` / `QubeeModule.forRoot()` based on the
 * active driver. Used by `QubeeQueryBuilder` to build request URIs.
 */
export const QUBEE_REQUEST_STRATEGY = new InjectionToken<IRequestStrategy>('QUBEE_REQUEST_STRATEGY');

/**
 * Injection token for the resolved request query-parameter key options
 *
 * Provided as a fully-built `QueryBuilderOptions` instance. `provideQubee()`
 * constructs it from `QubeeConfig.request`; consumers don't interact with this
 * token directly.
 */
export const QUBEE_REQUEST_OPTIONS = new InjectionToken<QueryBuilderOptions>('QUBEE_REQUEST_OPTIONS');

/**
 * Injection token for the resolved response parsing strategy
 *
 * Provided by `provideQubee()` / `QubeeModule.forRoot()` based on the
 * active driver. Used by `QubeePaginator` to parse paginated responses.
 */
export const QUBEE_RESPONSE_STRATEGY = new InjectionToken<IResponseStrategy>('QUBEE_RESPONSE_STRATEGY');

/**
 * Injection token for the resolved response field-key options
 *
 * Provided as a fully-built `ResponseOptions` instance (or a driver-specific
 * subclass like `JsonApiResponseOptions` / `NestjsResponseOptions`).
 * `provideQubee()` constructs the correct variant from `QubeeConfig.response`.
 */
export const QUBEE_RESPONSE_OPTIONS = new InjectionToken<ResponseOptions>('QUBEE_RESPONSE_OPTIONS');

/**
 * Injection token for the adapter `injectQubeeList()` reads and writes the
 * URL through
 *
 * Provided by `provideQubeeRouterAdapter()` (from `@qubeejs/angular/router`),
 * `provideQubeeBrowserAdapter()` or `provideQubeeMemoryAdapter()` — at the
 * root, or in a component's `providers` to give its subtree a different one.
 * Nothing is provided by default: a list never falls back to browser history
 * by itself, since inside a router that would leave the router out of step.
 */
export const QUBEE_LIST_ADAPTER = new InjectionToken<QubeeListAdapter>('QUBEE_LIST_ADAPTER');
