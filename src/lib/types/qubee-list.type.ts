import type { Injector, Signal } from '@angular/core';
import type {
  ListDefinition,
  ListInput,
  ListRequest,
  ListState,
  SortParam,
  ToggleSortOptions
} from '@qubeejs/core';

import type { QubeeListAdapter } from './qubee-list-adapter.type';

/**
 * Options of `set()` and `toggleSort()` on a {@link QubeeList}
 */
export type QubeeListSetOptions = {
  /**
   * Wait this many milliseconds of quiet before navigating — for a search
   * box. `state` updates at once regardless; a later call restarts the wait.
   */
  debounce?: number;

  /**
   * Replace the current history entry instead of pushing a new one
   */
  replace?: boolean;
};

/**
 * Options of `injectQubeeList()` common to every list
 */
export type QubeeListOptions = {
  /**
   * The adapter to read and write the URL through, in place of the one
   * provided under `QUBEE_LIST_ADAPTER` — `createQubeeMemoryAdapter()` for a
   * list whose state belongs to one component, say
   */
  adapter?: QubeeListAdapter;

  /**
   * The injector to resolve the adapter from and to tie the list's lifetime
   * to; required outside an injection context
   */
  injector?: Injector;
};

/**
 * The input a list declares, as `injectQubeeList()` takes it: the value, a
 * signal or function returning it, or `null` for "not ready yet"
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListInput<TList> = ListInput<TList> | null | (() => ListInput<TList> | null);

/**
 * The arguments `injectQubeeList()` takes after the list
 *
 * A list that declares an input requires `input` among the options; a list
 * that declares none refuses it. Spread it to wrap `injectQubeeList()` in a
 * function of your own:
 *
 * ```ts
 * function injectTable<T extends ListDefinition<ListParams>>(list: T, ...args: QubeeListArgs<T>): QubeeList<T> {
 *   return injectQubeeList(list, ...args);
 * }
 * ```
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListArgs<TList> = [ListInput<TList>] extends [never]
  ? [options?: QubeeListOptions & { input?: never }]
  : [options: QubeeListOptions & { input: QubeeListInput<TList> }];

/**
 * The value of a {@link QubeeList}'s `request`: a `ListRequest` for a list
 * without an input, and `ListRequest | null` for a list that declares one —
 * `null` while its input is `null`
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListRequest<TList> = [ListInput<TList>] extends [never] ? ListRequest : ListRequest | null;

/**
 * The keys of a list's params whose param is a `sortParam`
 */
type SortKeys<TParams> = {
  [K in keyof TParams]-?: TParams[K] extends SortParam<string> ? K : never;
}[keyof TParams];

/**
 * `K` when it is exactly one key; `never` when it is none or several
 */
type Single<K, TAll = K> = [K] extends [never]
  ? never
  : K extends unknown
    ? [Exclude<TAll, K>] extends [never] ? K : never
    : never;

/**
 * The API fields the `sortParam` at `K` allows
 */
type SortFields<TParams, K> = K extends keyof TParams
  ? TParams[K] extends SortParam<infer F> ? F : never
  : never;

/**
 * The `toggleSort` member of a {@link QubeeList}: present only when the list
 * declares exactly one `sortParam`, with `field` typed to the fields it allows
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeListSortToggle<TList> = TList extends ListDefinition<infer TParams, NonNullable<unknown>>
  ? [Single<SortKeys<TParams>>] extends [never]
    ? Record<never, never>
    : {
      /**
       * Sort by `field` ascending, or flip it when it is already the primary
       * sort; with `multiple`, keep the other sorts. At most one navigation.
       */
      readonly toggleSort: (
        field: SortFields<TParams, Single<SortKeys<TParams>>>,
        options?: QubeeListSetOptions & ToggleSortOptions
      ) => void;
    }
  : Record<never, never>;

/**
 * What `injectQubeeList()` returns for a list definition `TList`
 *
 * Reads are signals; writes are functions held as properties, so the handle
 * can be destructured. `toggleSort` is present when the list declares
 * exactly one `sortParam` — see {@link QubeeListSortToggle}.
 *
 * @typeParam TList - The list, as `defineList()` returned it
 */
export type QubeeList<TList> = {
  /**
   * The href for the current state with `changes` applied — for links, which
   * stay crawlable and middle-clickable. Built from the draft, so it includes
   * what `set()` has not committed yet. Reads signals, so a template that
   * calls it updates with the list.
   */
  readonly href: (changes?: Partial<ListState<TList>>) => string;

  /**
   * A debounce is waiting, or a navigation is in flight
   */
  readonly isPending: Signal<boolean>;

  /**
   * `{ uri, headers, paginate }` for the state in the URL and the input
   *
   * Changes once per navigation, never per keystroke, and only when the URI
   * or the headers differ, so `httpResource()` and other fetchers built on it
   * fetch exactly once per page. `null` while the input is `null`.
   */
  readonly request: Signal<QubeeListRequest<TList>>;

  /**
   * Return every param to its default in one navigation; parameters the list
   * does not own are kept, and a list already at its defaults does not
   * navigate
   */
  readonly reset: (options?: Omit<QubeeListSetOptions, 'debounce'>) => void;

  /**
   * Apply `changes` and navigate — at most one navigation per call. A change
   * to anything but the page returns to page 1; `undefined` returns a param
   * to its default.
   */
  readonly set: (changes: Partial<ListState<TList>>, options?: QubeeListSetOptions) => void;

  /**
   * `set({ page })`
   */
  readonly setPage: (page: number, options?: Omit<QubeeListSetOptions, 'debounce'>) => void;

  /**
   * The list's state, including changes not yet in the URL
   */
  readonly state: Signal<ListState<TList>>;
} & QubeeListSortToggle<TList>;
