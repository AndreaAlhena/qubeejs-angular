import type { ModuleWithProviders } from '@angular/core';
import type { QubeeConfig } from '@qubeejs/core';

import { NgModule } from '@angular/core';

import { buildQubeeProviders } from './provide-qubee';

// @dynamic
/**
 * NgModule entry point for applications that still bootstrap with modules
 *
 * Standalone applications use `provideQubee()` instead; both register the
 * same providers.
 */
@NgModule({})
export class QubeeModule {
  /**
   * Configure Qubee for the root module
   *
   * NgModule-style equivalent of `provideQubee()`.
   *
   * @param config - The driver definition, plus optional pagination mode and
   * request / response key overrides
   * @returns Module with providers configured for the specified driver
   */
  public static forRoot(config: QubeeConfig): ModuleWithProviders<QubeeModule> {
    return {
      ngModule: QubeeModule,
      providers: buildQubeeProviders(config),
    };
  }
}
