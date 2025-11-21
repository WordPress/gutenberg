/**
 * Internal dependencies
 */
import type {
	PaddingSize,
	PaddingOptions,
	DimensionVariant,
} from '../../types/private';

/**
 * Maps padding size tokens to CSS values.
 * Aligned with the Box component's spacing scale (space function with 4px base):
 * - x-small: space(2) = 8px
 * - small: space(4) = 16px
 * - medium: space(6) = 24px
 * - large: space(8) = 32px
 * - x-large: space(12) = 48px
 */
const paddingValuesBySize: Record< PaddingSize, string > = {
	'x-small': '8px',
	small: '16px',
	medium: '24px',
	large: '32px',
	'x-large': '48px',
	none: '0',
};

/**
 * Gets the CSS value for a single padding size token.
 *
 * @param size The padding size token.
 * @return The CSS value for the padding size.
 */
function getSinglePaddingValue( size: PaddingSize ): string {
	return paddingValuesBySize[ size ];
}

/**
 * Converts padding options into CSS custom property style values.
 * Returns an object with the appropriate CSS custom properties set.
 * When padding is undefined, returns an empty object to allow SCSS
 * defaults and container queries to apply.
 *
 * @param padding The padding option (single size or directional variants), or undefined to use SCSS defaults
 * @return An object with CSS custom property values, or empty object to use SCSS defaults
 */
export function getPaddingBySizeStyles(
	padding: PaddingOptions | undefined
): Record< string, string > {
	const styles: Record< string, string > = {};

	// Handle string-based sizes (single value applied to all directional variants)
	if ( typeof padding === 'string' ) {
		const value = getSinglePaddingValue( padding );
		styles[ '--dataviews-padding-block-start' ] = value;
		styles[ '--dataviews-padding-block-end' ] = value;
		styles[ '--dataviews-padding-inline-start' ] = value;
		styles[ '--dataviews-padding-inline-end' ] = value;
		return styles;
	}

	// If no padding specified, return empty object to use SCSS defaults
	if ( ! padding ) {
		return styles;
	}

	// Handle object with directional variants
	const { block, blockStart, blockEnd, inline, inlineStart, inlineEnd } =
		padding as DimensionVariant< PaddingSize >;

	if ( block !== undefined ) {
		const value = getSinglePaddingValue( block );
		if ( blockStart === undefined ) {
			styles[ '--dataviews-padding-block-start' ] = value;
		}
		if ( blockEnd === undefined ) {
			styles[ '--dataviews-padding-block-end' ] = value;
		}
	}

	if ( blockStart !== undefined ) {
		styles[ '--dataviews-padding-block-start' ] =
			getSinglePaddingValue( blockStart );
	}

	if ( blockEnd !== undefined ) {
		styles[ '--dataviews-padding-block-end' ] =
			getSinglePaddingValue( blockEnd );
	}

	if ( inline !== undefined ) {
		const value = getSinglePaddingValue( inline );
		if ( inlineStart === undefined ) {
			styles[ '--dataviews-padding-inline-start' ] = value;
		}
		if ( inlineEnd === undefined ) {
			styles[ '--dataviews-padding-inline-end' ] = value;
		}
	}

	if ( inlineStart !== undefined ) {
		styles[ '--dataviews-padding-inline-start' ] =
			getSinglePaddingValue( inlineStart );
	}

	if ( inlineEnd !== undefined ) {
		styles[ '--dataviews-padding-inline-end' ] =
			getSinglePaddingValue( inlineEnd );
	}

	return styles;
}
