import { EnvironmentProviders, Provider, makeEnvironmentProviders } from '@angular/core';
import { PaginationModeEnum, QueryBuilderOptions } from '@qubeejs/core';

import type { QubeeConfig } from '@qubeejs/core';

import { QubeeQueryBuilder } from './services/qubee-query-builder';
import { QubeeSignalStore } from './services/qubee-signal-store';
import { QubeePaginator } from './services/qubee-paginator';
import {
  QUBEE_DRIVER,
  QUBEE_REQUEST_OPTIONS,
  QUBEE_REQUEST_STRATEGY,
  QUBEE_RESPONSE_OPTIONS,
  QUBEE_RESPONSE_STRATEGY
} from './tokens/qubee.tokens';

/**
 * Build the core provider list shared by `provideQubee()` and
 * `QubeeModule.forRoot()`
 *
 * Calls the driver definition's three factories — request strategy, response
 * strategy, response options — exactly as the core's `createQubee()` does,
 * and exposes the results through injection tokens so that
 * `provideQubeeInstance()` can re-create only the services at a narrower
 * injector while inheriting the driver wiring.
 *
 * @param config - The driver definition, plus optional pagination mode and
 * request / response key overrides
 * @returns An array of Providers for the environment injector
 */
export function buildQubeeProviders(config: QubeeConfig): Provider[] {
  const { driver, pagination = PaginationModeEnum.QUERY, request = {}, response = {} } = config;

  return [
    { provide: QUBEE_DRIVER, useValue: driver },
    { provide: QUBEE_REQUEST_STRATEGY, useValue: driver.createRequestStrategy(pagination) },
    { provide: QUBEE_REQUEST_OPTIONS, useValue: new QueryBuilderOptions(request) },
    { provide: QUBEE_RESPONSE_STRATEGY, useValue: driver.createResponseStrategy() },
    { provide: QUBEE_RESPONSE_OPTIONS, useValue: driver.createResponseOptions(response) },
    ...provideQubeeInstance()
  ];
}

/**
 * Sets up providers necessary to enable `Qubee` functionality for the application.
 *
 * @usageNotes
 *
 * Pass the driver **definition** exported by the core — `STRAPI_DRIVER`,
 * `LARAVEL_DRIVER`, … — rather than an id. Importing one definition lets the
 * other nineteen drivers tree-shake out of your bundle:
 * ```
 * import { STRAPI_DRIVER, provideQubee } from '@qubeejs/angular';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [provideQubee({ driver: STRAPI_DRIVER })]
 * });
 * ```
 *
 * When the backend is only known at runtime, look the definition up in the
 * registry — the cost of bundling every driver is then visible at your own
 * import site:
 * ```
 * import { DRIVERS, provideQubee } from '@qubeejs/angular';
 *
 * provideQubee({ driver: DRIVERS[environment.driver] });
 * ```
 *
 * Request and response key overrides, and the PostgREST pagination mode,
 * are passed alongside the driver:
 * ```
 * import { PaginationModeEnum, POSTGREST_DRIVER, provideQubee } from '@qubeejs/angular';
 *
 * provideQubee({
 *   driver: POSTGREST_DRIVER,
 *   pagination: PaginationModeEnum.RANGE,
 *   response: { data: 'items' }
 * });
 * ```
 *
 * @publicApi
 * @param config - The driver definition, plus optional pagination mode and
 * request / response key overrides
 * @returns A set of providers to setup Qubee
 */
export function provideQubee(config: QubeeConfig): EnvironmentProviders {
  return makeEnvironmentProviders(buildQubeeProviders(config));
}

/**
 * Providers for a component-scoped Qubee instance
 *
 * Use this inside a standalone component's `providers: [...]` to get a
 * dedicated `QubeeQueryBuilder` (and its `QubeeSignalStore` / `QubeePaginator`
 * collaborators) whose query-builder and pagination state does not bleed
 * with the app-wide shared instance provided by `provideQubee()`.
 *
 * @usageNotes
 *
 * ```
 * @Component({
 *   standalone: true,
 *   providers: [...provideQubeeInstance()]
 * })
 * export class MyFeatureComponent {
 *   private readonly _qb = inject(QubeeQueryBuilder);
 * }
 * ```
 *
 * The driver, strategies, and options are inherited from the environment
 * injector (`provideQubee()` at root), so only the store and the two
 * services are re-created at the component level.
 *
 * @publicApi
 * @returns A provider array to spread into a component's `providers`
 */
export function provideQubeeInstance(): Provider[] {
  return [QubeeSignalStore, QubeeQueryBuilder, QubeePaginator];
}
