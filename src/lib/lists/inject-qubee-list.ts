import type {
  ListDefinition,
  ListInput,
  ListLocation,
  ListParam,
  ListParams,
  ListRequest,
  ParamsState,
  Sort,
  ToggleSortOptions,
} from '@qubeejs/core';

import { DOCUMENT } from '@angular/common';
import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { buildListHref, buildListRequest, readListState, toggleSort } from '@qubeejs/core';

import type {
  QubeeList,
  QubeeListArgs,
  QubeeListInput,
  QubeeListSetOptions,
} from '../types/qubee-list.type';

import { MissingRouterAdapterError } from '../errors/missing-router-adapter.error';
import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { deepEqual } from '../utils/deep-equal';
import { parseHref } from '../utils/parse-href';

/**
 * A state set with `set()` that the URL does not show yet
 */
type Draft = {
  /**
   * Canonical href of the draft — `buildListHref()` of its location
   */
  readonly href: string;

  /**
   * Where the draft wants the URL to be
   */
  readonly location: ListLocation;

  /**
   * Canonical hrefs the URL may show while the draft stays alive: the one it
   * was made on, then each navigation this list started since. Any other
   * means the user went elsewhere — Back, Forward, a link — and the draft is
   * dropped.
   */
  readonly own: readonly string[];
};

/**
 * A list's state as a reactive handle, read from the URL and written back to it
 *
 * Takes a list declared once with the core's `defineList()` and returns its
 * typed `state`, the `request` to fetch it with, and the functions that
 * change it. The URL is the source of truth; the adapter provided under
 * `QUBEE_LIST_ADAPTER` decides which URL — the Angular Router's, the browser
 * history's or one kept in memory.
 *
 * - `state` updates as soon as `set()` is called, so an input never lags
 *   behind a debounce or a navigation.
 * - `set()` navigates at most once per call. Defaults stay out of the URL, a
 *   change to anything but the page returns to page 1, and parameters the
 *   list does not own are kept.
 * - `request` changes once per navigation, never per keystroke, and only
 *   when the URI or the headers differ.
 * - Back, Forward or a link elsewhere drop anything not yet in the URL and
 *   cancel a pending debounce; so does destroying the injection context. A
 *   click on a link while a debounce waits commits it first.
 *
 * @example
 * ```ts
 * @Component({
 *   template: `
 *     <input [value]="list.state().q ?? ''" (input)="search($event)" />
 *     @for (article of articles.value()?.data; track article.id) { <p>{{ article.title }}</p> }
 *   `
 * })
 * export class ArticlesComponent {
 *   protected readonly list = injectQubeeList(articleList);
 *
 *   protected readonly articles = httpResource(
 *     () => ({ url: this.list.request().uri, headers: this.list.request().headers ?? {} }),
 *     { parse: (body) => this.list.request().paginate<Article>(body as RawResponse) }
 *   );
 *
 *   protected search(event: Event): void {
 *     this.list.set({ q: (event.target as HTMLInputElement).value }, { debounce: 300, replace: true });
 *   }
 * }
 * ```
 *
 * A list that declares an input — a project id from the route path, say —
 * takes it as `input`, as a value or a signal; `null` means "not ready yet"
 * and makes `request` `null`:
 *
 * ```ts
 * readonly projectId = input.required<string>();
 * readonly tasks = injectQubeeList(taskList, { input: () => ({ projectId: this.projectId() }) });
 * ```
 *
 * @param list - The list, as `defineList()` returned it — a module-level constant
 * @param args - Options: `input` (required for a list that declares one),
 * `adapter` and `injector`
 * @returns The list handle
 * @throws {MissingRouterAdapterError} If no adapter is passed and none is provided
 * @throws If called outside an injection context without an `injector`
 */
export function injectQubeeList<TList extends ListDefinition<ListParams, NonNullable<unknown>>>(
  list: TList,
  ...args: QubeeListArgs<TList>
): QubeeList<TList> {
  const [options] = args;

  if (!options?.injector) {
    assertInInjectionContext(injectQubeeList);
  }

  const injector = options?.injector ?? inject(Injector);
  const adapter = options?.adapter ?? injector.get(QUBEE_LIST_ADAPTER, null);

  if (!adapter) {
    throw new MissingRouterAdapterError();
  }

  // The list twice: loose, for the functions that take any list; wide, to
  // forward an input the generic TList hides from buildListRequest().
  const loose: ListDefinition<ListParams> = list;
  const wide: ListDefinition<ListParams, NonNullable<unknown>> = list;
  const input = (options as { input?: QubeeListInput<TList> } | undefined)?.input;
  const hasInput = input !== undefined;
  const doc = injector.get(DOCUMENT, null);

  const draft = signal<Draft | null>(null);
  const isWaiting = signal(false);
  const inFlight = signal(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timerReplace = false;

  const current = computed(() => {
    const location = adapter.location();

    return { href: buildListHref(loose, location), location };
  });

  // The draft while the URL still shows a state this list put there; null
  // once the URL reached it or went elsewhere. Derived, not written, so a
  // Back press drops the draft in the same read that sees the new URL.
  const liveDraft = computed(() => {
    const value = draft();
    const { href } = current();

    return value && value.href !== href && value.own.includes(href) ? value : null;
  });

  const committed = computed(() => readListState(loose, current().location.search), {
    equal: deepEqual,
  });

  const state = computed(
    () => {
      const value = liveDraft();

      return value ? readListState(loose, value.location.search) : committed();
    },
    { equal: deepEqual }
  );

  const request = computed<ListRequest | null>(
    () => {
      const listState: ParamsState<ListParams> = committed();

      if (!hasInput) {
        return buildListRequest(loose, listState);
      }

      // Not redundant: with TList generic, `typeof === 'function'` narrows to a
      // union that is not callable, and dropping the cast makes `value` an error type.
      const value =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        typeof input === 'function' ? (input as () => ListInput<TList> | null)() : input;

      return value === null || value === undefined
        ? null
        : buildListRequest(wide, listState, value);
    },
    { equal: isSameRequest }
  );

  const isPending = computed(() => liveDraft() !== null && (isWaiting() || inFlight() > 0));

  const onDocumentClick = (event: Event): void => {
    const target = event.target as { closest?: (selector: string) => unknown } | null;

    if (target?.closest?.('a[href]')) {
      commit(timerReplace);
    }
  };

  const clearTimer = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      doc?.removeEventListener('click', onDocumentClick, true);
    }

    isWaiting.set(false);
  };

  // Forget hrefs the URL has moved past, and the draft itself once it is in
  // the URL or the user went elsewhere.
  const prune = (): void => {
    const value = draft();

    if (!value) {
      return;
    }

    const { href } = current();
    const index = value.own.indexOf(href);

    if (index < 0 || value.href === href) {
      draft.set(null);
      clearTimer();
    } else if (index > 0) {
      draft.set({ ...value, own: value.own.slice(index) });
    }
  };

  const commit = (replace: boolean): void => {
    clearTimer();

    const value = liveDraft();

    if (!value) {
      return;
    }

    draft.set({ ...value, own: [...value.own, value.href] });
    inFlight.update((count) => count + 1);

    const settle = (): void => {
      inFlight.update((count) => count - 1);

      // Over without reaching its target — a guard refused it, say: the URL
      // is the source of truth, so the draft that asked for it goes.
      if (draft()?.href === value.href && current().href !== value.href) {
        draft.set(null);
      }

      prune();
    };
    let result: unknown;

    try {
      result = adapter.navigate(value.href, { replace });
    } catch (error) {
      settle();

      throw error;
    }

    if (isPromiseLike(result)) {
      result.then(settle, settle);
    } else {
      settle();
    }
  };

  const set = (changes: object, setOptions: QubeeListSetOptions = {}): void => {
    untracked(() => {
      prune();

      const base = liveDraft();
      const { href: currentHref, location } = current();
      const href = buildListHref(loose, base?.location ?? location, changes);

      if (href === currentHref) {
        draft.set(null);
        clearTimer();

        return;
      }

      const { debounce = 0, replace = false } = setOptions;

      if (href === base?.href) {
        // The same change again: without a debounce, it goes now.
        if (debounce <= 0 && timer !== undefined) {
          commit(replace);
        }

        return;
      }

      draft.set({ href, location: parseHref(href), own: base?.own ?? [currentHref] });

      if (debounce > 0) {
        if (timer === undefined) {
          doc?.addEventListener('click', onDocumentClick, true);
        } else {
          clearTimeout(timer);
        }

        timerReplace = replace;
        isWaiting.set(true);
        timer = setTimeout(() => {
          timer = undefined;
          doc?.removeEventListener('click', onDocumentClick, true);
          commit(timerReplace);
        }, debounce);
      } else {
        commit(replace);
      }
    });
  };

  injector.get(DestroyRef).onDestroy(clearTimer);

  const params: Readonly<Record<string, ListParam<unknown>>> = list.params;
  const sortNames = Object.keys(params).filter((name) => 'sortFields' in params[name]);
  const handle = {
    href: (changes: object = {}): string =>
      buildListHref(loose, (liveDraft() ?? current()).location, changes),
    isPending,
    request,
    reset: (resetOptions: Omit<QubeeListSetOptions, 'debounce'> = {}): void =>
      set(Object.fromEntries(Object.keys(params).map((name) => [name, undefined])), {
        replace: resetOptions.replace,
      }),
    set,
    setPage: (page: number, pageOptions: Omit<QubeeListSetOptions, 'debounce'> = {}): void =>
      set({ page }, { replace: pageOptions.replace }),
    state,
    ...(sortNames.length === 1 && {
      toggleSort: (
        field: string,
        sortOptions: QubeeListSetOptions & ToggleSortOptions = {}
      ): void => {
        const [name] = sortNames;
        const sorts = untracked(state)[name] as readonly Sort[];
        const { multiple, ...rest } = sortOptions;

        set({ [name]: toggleSort(sorts, field, { multiple }) }, rest);
      },
    }),
  };

  return handle as unknown as QubeeList<TList>;
}

/**
 * Whether two requests fetch the same thing: same URI, same headers
 *
 * @param a - First request
 * @param b - Second request
 * @returns `true` when both are `null` or ask for the same page
 */
function isSameRequest(a: ListRequest | null, b: ListRequest | null): boolean {
  return (
    a === b || (a !== null && b !== null && a.uri === b.uri && deepEqual(a.headers, b.headers))
  );
}

/**
 * Whether a navigation result is a promise to wait for
 *
 * @param value - What the adapter's `navigate()` returned
 * @returns `true` for a thenable
 */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | null)?.then === 'function';
}
