const PRESET_PREFIX = 'var:preset|dimension|';

/**
 * Converts a column width into the `flex-basis` value that sizes the column
 * within its flex container.
 *
 * @param {string|number|undefined} width Column width.
 *
 * @return {string|undefined} Flex basis value, or undefined when there is none.
 */
export function getColumnFlexBasis( width ) {
	// Numbers are handled for backward compatibility as they can still be
	// provided by templates and patterns.
	if ( Number.isFinite( width ) ) {
		return width ? `${ width }%` : undefined;
	}

	if ( typeof width !== 'string' || ! width ) {
		return undefined;
	}

	if ( width.startsWith( PRESET_PREFIX ) ) {
		return `var(--wp--preset--dimension--${ width.slice(
			PRESET_PREFIX.length
		) })`;
	}

	if ( ! /\d/.test( width ) ) {
		return undefined;
	}

	if ( width.endsWith( '%' ) ) {
		// In some cases we need to round the width to a shorter float.
		const multiplier = 1000000000000;
		return `${
			Math.round( Number.parseFloat( width ) * multiplier ) / multiplier
		}%`;
	}

	return width;
}
