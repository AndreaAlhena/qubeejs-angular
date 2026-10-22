/**
 * Thrown by `injectQubeeList()` when no adapter is passed and none is
 * provided under `QUBEE_LIST_ADAPTER`
 *
 * Same name as `@qubeejs/react`'s, for the same mistake.
 */
export class MissingRouterAdapterError extends Error {
  /**
   * Create the error, with a message naming every way to supply an adapter
   */
  constructor() {
    super(
      'injectQubeeList() found no adapter. Provide one — provideQubeeRouterAdapter() from ' +
        "'@qubeejs/angular/router', provideQubeeBrowserAdapter() or provideQubeeMemoryAdapter() — " +
        'or pass { adapter } to injectQubeeList().'
    );

    this.name = 'MissingRouterAdapterError';
  }
}
