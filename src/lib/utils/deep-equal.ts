/**
 * Structural equality for JSON-like values — primitives, arrays and plain
 * objects, nested to any depth
 *
 * Used as the `equal` function of the signals this adapter derives from the
 * core store. The core produces a fresh, frozen snapshot on **every** write,
 * including writes that leave the state unchanged (a `paginate()` re-syncing
 * the page it was asked for, say). Comparing by identity would propagate
 * those non-changes to every dependent signal — and to `httpResource()`
 * requests built from `paginationHeaders()`, which would then re-fetch.
 * Comparing structurally means a signal notifies exactly when its value
 * differs.
 *
 * @param a - First value
 * @param b - Second value
 * @returns `true` when both values have the same shape and content
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => deepEqual(value, b[index]))
    );
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);

  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.prototype.hasOwnProperty.call(right, key) && deepEqual(left[key], right[key])
    )
  );
}
