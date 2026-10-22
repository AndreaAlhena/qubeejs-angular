import type { ListDefinition, ListParams, ParamsState, QueryBuilder } from '@qubeejs/core';

import { defineList, integerParam, SPATIE_DRIVER, stringParam } from '@qubeejs/core';

import { injectQubeeList } from './inject-qubee-list';

/*
 * Compile-time checks: whether `injectQubeeList()` requires, accepts or
 * refuses an `input` must follow the list's own declaration, however that
 * list's type is written. The core fixed several of these shapes in 1.4.1
 * (#39, #40, #41); this spec fails to compile if the adapter loses one.
 *
 * Nothing here runs: `injectQubeeList()` needs an injection context, and the
 * assertions are the `@ts-expect-error` lines, which fail when unused.
 */

const qubee = { driver: SPATIE_DRIVER };
const params = { page: integerParam('page', { default: 1, min: 1 }), q: stringParam('q') };

const plain = defineList({
  apply: (builder, { q }): void => {
    if (q) {
      builder.addFilter('title', q);
    }
  },
  params,
  qubee,
  resource: 'articles',
});

const withInput = defineList({
  apply: (builder, _state, { projectId }: { projectId: string }): void => {
    builder.addFilter('project', projectId);
  },
  params,
  qubee,
  resource: 'tasks',
});

const noneDeclared = defineList({
  apply: (builder, _state, _input?: never): void => {
    builder.setLimit(5);
  },
  params,
  qubee,
  resource: 'articles',
});

type LooseList = ListDefinition<ListParams>;

type HandWrittenList = Omit<ListDefinition<typeof params>, 'apply'> & {
  apply: (builder: QueryBuilder, state: ParamsState<typeof params>, input: { id: number }) => void;
};

/**
 * Never called; type-checked only
 *
 * @param handWritten - A list whose type is written by hand
 */
function typeChecks(handWritten: HandWrittenList): void {
  // A list without input takes no options, and refuses an input.
  injectQubeeList(plain);
  // @ts-expect-error a list that declares no input refuses one
  injectQubeeList(plain, { input: { x: 1 } });

  // A declared input is required, as a value, a function or null.
  injectQubeeList(withInput, { input: { projectId: '1' } });
  injectQubeeList(withInput, { input: (): null => null });
  // @ts-expect-error the declared input is missing
  injectQubeeList(withInput);

  // Through a type alias (#39).
  const aliased: LooseList = plain;
  injectQubeeList(aliased);

  // Spread into a new object, keeping its input (#39).
  const spread = { ...withInput };
  injectQubeeList(spread, { input: { projectId: '1' } });
  // @ts-expect-error the input is still required after a spread
  injectQubeeList(spread);

  // An input annotated as none declares no input (#40).
  injectQubeeList(noneDeclared);

  // A hand-written list whose apply requires its input (#41).
  injectQubeeList(handWritten, { input: { id: 1 } });
  // @ts-expect-error the hand-written list's input is missing
  injectQubeeList(handWritten);
}

describe('injectQubeeList() input typing', () => {
  it('should compile for every way a list type can be written', () => {
    expect(typeChecks).toEqual(jasmine.any(Function));
  });
});
