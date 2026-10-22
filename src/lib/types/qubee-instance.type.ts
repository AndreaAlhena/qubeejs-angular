import type { QubeePaginator } from '../services/qubee-paginator';
import type { QubeeQueryBuilder } from '../services/qubee-query-builder';
import type { QubeeSignalStore } from '../services/qubee-signal-store';

/**
 * What `createQubeeInstance()` returns: the three Angular objects, already
 * wired together around one private store
 *
 * Mirrors the core's `Qubee` type (`createQubee()`'s return value) with the
 * Angular, signal-bearing counterparts in each slot.
 */
export type QubeeInstance = {
  /**
   * Builds query URIs and exposes the state as signals. Mutates the shared store.
   */
  builder: QubeeQueryBuilder;

  /**
   * Parses responses and syncs page metadata back into the shared store.
   */
  paginator: QubeePaginator;

  /**
   * The state both of the above read and write, as a signal.
   */
  store: QubeeSignalStore;
};
