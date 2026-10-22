import { inject, Injector } from '@angular/core';

import type { QubeeInstance } from './types/qubee-instance.type';

import { provideQubeeInstance } from './provide-qubee';
import { QubeePaginator } from './services/qubee-paginator';
import { QubeeQueryBuilder } from './services/qubee-query-builder';
import { QubeeSignalStore } from './services/qubee-signal-store';

/**
 * Create an isolated query builder, paginator and store, wired together
 *
 * `provideQubeeInstance()` isolates state per **component**. This factory
 * does the same for code that has no component injector to hang providers on —
 * typically a root-scoped feature service that wants private query state
 * instead of sharing the app-wide `QubeeQueryBuilder` with every other
 * service. Two root services that each call it never see each other's
 * filters or pages.
 *
 * The three objects are created in a child injector of `injector`, so the
 * driver, strategies and options configured by `provideQubee()` are
 * inherited; only the state is new. Nothing needs tearing down: the child
 * injector is referenced only by the objects it created and is collected
 * with them.
 *
 * @example
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class UserApi {
 *   private readonly _qubee = createQubeeInstance();
 *
 *   readonly users = httpResource<RawResponse>(() => this._qubee.builder.uri());
 *
 *   list(): void {
 *     this._qubee.builder.setResource('users').setLimit(25);
 *   }
 * }
 * ```
 *
 * @param injector - The injector to inherit the driver wiring from. Defaults to
 * the current injection context, so a field initialiser or constructor of an
 * injectable can omit it; pass one explicitly when calling from elsewhere.
 * @returns The builder, paginator and the store they share
 * @throws If called outside an injection context without an `injector`
 */
export function createQubeeInstance(injector?: Injector): QubeeInstance {
  const scope = Injector.create({
    name: 'QubeeInstance',
    parent: injector ?? inject(Injector),
    providers: provideQubeeInstance()
  });

  return {
    builder: scope.get(QubeeQueryBuilder),
    paginator: scope.get(QubeePaginator),
    store: scope.get(QubeeSignalStore)
  };
}
