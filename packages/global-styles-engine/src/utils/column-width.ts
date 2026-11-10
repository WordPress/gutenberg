/*
 * Keep in sync with the PHP mirror in `lib/block-supports/dimensions.php`.
 */

const FILL_SLUG = 'fill';
const FILL_PRESET_VALUE = `var:preset|dimension|${ FILL_SLUG }`;
const FILL_CSS_VAR = `var(--wp--preset--dimension--${ FILL_SLUG })`;

/**
 * Whether a column width asks the column to take the remaining space.
 *
 * Both the raw attribute value and the resolved custom property are matched,
 * because the width reaches this code already resolved from the style engine
 * and unresolved from a block's attributes.
 *
 * A zero length means the same thing. `flex-basis: 0` without `flex-grow` is
 * never a usable column, and the width control's built-in "None" option
 * stores `0`.
 *
 * @param width Column width.
 *
 * @return Whether the column should fill the remaining space.
 */
export function isColumnFillWidth( width?: string | number ) {
	if ( width === FILL_PRESET_VALUE || width === FILL_CSS_VAR ) {
		return true;
	}

	const quantity = Number.parseFloat( width as string );
	return Number.isFinite( quantity ) && 0 === quantity;
}

/**
 * Returns the flex declarations that size a column of the given width.
 *
 * The column block lives in a flex container, so it sizes itself with
 * `flex-basis` rather than `width`. A column given a width keeps it instead of
 * stretching, which is what `flex-grow: 0` is for.
 *
 * @param width Column width, resolved to a CSS value.
 *
 * @return The `flex-basis` and `flex-grow` values for the column.
 */
export function getColumnFlexDeclarations( width: string ) {
	return isColumnFillWidth( width )
		? { flexBasis: '0', flexGrow: '1' }
		: { flexBasis: width, flexGrow: '0' };
}
