import { ModuleWithProviders, NgModule } from '@angular/core';

import type { QubeeConfig } from '@qubeejs/core';

import { buildQubeeProviders } from './provide-qubee';

// @dynamic
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
      providers: buildQubeeProviders(config)
    };
  }
}
