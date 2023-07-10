/**
 * Marks the next value change as 'expensive'.
 *
 * This can be used for preferences that might be updated regularly.
 * The persistence layer `set` function receives an `isExpensive: true` option when
 * this is set and allows it to make optimizations around saving the value.
 *
 * @return {Object} Action object.
 */
export const markNextChangeAsExpensive = () => ( {
	type: 'MARK_NEXT_CHANGE_AS_EXPENSIVE',
} );
