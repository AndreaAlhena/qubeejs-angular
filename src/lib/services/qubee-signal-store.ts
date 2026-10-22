import type { Signal} from '@angular/core';
import type { QueryBuilderState } from '@qubeejs/core';

import { inject, Injectable, signal } from '@angular/core';
import { QubeeStore } from '@qubeejs/core';

import { QUBEE_BASE_URL } from '../tokens/qubee.tokens';
import { deepEqual } from '../utils/deep-equal';

/**
 * The query-builder state container, made reactive for Angular
 *
 * Extends the framework-agnostic `QubeeStore` from `@qubeejs/core` with a
 * single addition: {@link state}, a read-only `Signal` mirroring the store's
 * snapshot. The core exposes state through `getSnapshot()` + `subscribe()`
 * (the `useSyncExternalStore` contract) and deliberately ships no reactivity
 * of its own; this class is where the Angular adapter supplies it.
 *
 * One instance is shared per injector scope by `QubeeQueryBuilder` and
 * `QubeePaginator`: the builder writes to it, the paginator syncs page
 * metadata back into it, and both derive their signals from it.
 *
 * Snapshots are deeply frozen by the core, so a consumer cannot corrupt the
 * state by mutating what `state()` returns — an attempt throws in strict mode
 * instead of silently poisoning later reads.
 *
 * @example
 * ```typescript
 * const store = inject(QubeeSignalStore);
 *
 * effect(() => console.log('page is now', store.state().page));
 * ```
 */
@Injectable()
export class QubeeSignalStore extends QubeeStore {

  /**
   * Writable mirror of the core snapshot, updated from the store's own
   * `subscribe()` notifications
   *
   * Compared structurally: the core clones on every write, so two
   * consecutive snapshots are never the same object even when nothing
   * changed. Structural equality keeps a no-op write — `paginate()` syncing
   * the page that was already current — from notifying anyone.
   */
  private readonly _stateSignal = signal<QueryBuilderState>(this.getSnapshot(), { equal: deepEqual });

  /**
   * The current query-builder state as a read-only signal
   *
   * Notifies exactly when the state differs from the previous one, so
   * `computed()`, `effect()` and templates re-evaluate on real changes only.
   */
  public readonly state: Signal<QueryBuilderState> = this._stateSignal.asReadonly();

  /**
   * Create the store, mirror every write into `state`, and apply the
   * configured base URL
   */
  constructor() {
    super();

    // The listener lives exactly as long as this store, so there is nothing
    // to tear down: both are collected together.
    this.subscribe(() => this._stateSignal.set(this.getSnapshot()));

    // Starts from the configured base URL, as the core's createQubee() does;
    // set after subscribing so the signal sees it.
    const baseUrl = inject(QUBEE_BASE_URL);

    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }
}
