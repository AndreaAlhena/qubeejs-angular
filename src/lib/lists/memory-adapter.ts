import type { Provider } from '@angular/core';
import type { ListLocation, SearchParamsInput } from '@qubeejs/core';

import { signal } from '@angular/core';
import { toSearchParams } from '@qubeejs/core';

import type { QubeeListAdapter } from '../types/qubee-list-adapter.type';

import { QUBEE_LIST_ADAPTER } from '../tokens/qubee.tokens';
import { isSameLocation, parseHref } from '../utils/parse-href';

/**
 * Create an adapter that keeps a list's query in memory, out of the address bar
 *
 * For a list that lives inside something else — a dialog, a picker, a second
 * table on the same screen — whose state would otherwise add history entries
 * nobody goes back to. There is no history: `replace` makes no difference and
 * there is no Back. Everything else — typed state, `set()`, debounce,
 * `request` — behaves as with a URL.
 *
 * Pass it to one list for state that belongs to one component, or provide it
 * with {@link provideQubeeMemoryAdapter} to share it with a subtree:
 *
 * ```ts
 * readonly tags = injectQubeeList(tagList, { adapter: createQubeeMemoryAdapter('status=draft') });
 * ```
 *
 * @param initialSearch - The query the state starts from, in any shape
 * `readListState()` takes
 * @returns An adapter whose location starts at `initialSearch`
 */
export function createQubeeMemoryAdapter(initialSearch: SearchParamsInput = ''): QubeeListAdapter {
  const search = toSearchParams(initialSearch).toString();
  const location = signal<ListLocation>(
    { pathname: '', search: search ? `?${search}` : '' },
    { equal: isSameLocation }
  );

  return {
    location: location.asReadonly(),
    navigate: (href: string): void => location.set(parseHref(href)),
  };
}

/**
 * Provide a memory adapter to every list under an injector
 *
 * In a component's `providers`, the lists of that component and its children
 * share one in-memory state, which is gone with the component:
 *
 * ```ts
 * @Component({
 *   providers: [provideQubeeMemoryAdapter()],
 *   template: `<app-tag-filters /><app-tag-table />`
 * })
 * export class TagPickerComponent {}
 * ```
 *
 * @param initialSearch - The query the state starts from
 * @returns The provider for `QUBEE_LIST_ADAPTER`
 */
export function provideQubeeMemoryAdapter(initialSearch?: SearchParamsInput): Provider[] {
  return [
    { provide: QUBEE_LIST_ADAPTER, useFactory: () => createQubeeMemoryAdapter(initialSearch) },
  ];
}
