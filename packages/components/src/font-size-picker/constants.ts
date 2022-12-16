/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * List of default short names.
 *
 * When there are 5 font sizes or fewer, we assume that the font sizes are
 * ordered by size and show T-shirt labels.
 */
export const DEFAULT_SHORT_NAMES = [
	/* translators: S stands for 'small' and is a size label. */
	__( 'S' ),
	/* translators: M stands for 'medium' and is a size label. */
	__( 'M' ),
	/* translators: L stands for 'large' and is a size label. */
	__( 'L' ),
	/* translators: XL stands for 'extra large' and is a size label. */
	__( 'XL' ),
	/* translators: XXL stands for 'extra extra large' and is a size label. */
	__( 'XXL' ),
];

/**
 * List of default T-shirt names.
 *
 * When there are 5 font sizes or fewer, we assume that the font sizes are
 * ordered by size and show T-shirt labels.
 */
export const DEFAULT_NAMES = [
	__( 'Small' ),
	__( 'Medium' ),
	__( 'Large' ),
	__( 'Extra Large' ),
	__( 'Extra Extra Large' ),
];
