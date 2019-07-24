/**
 * Sizes
 *
 * defines the sizes used in dimension controls
 * all hardcoded `size` values are based on the value of
 * the Sass variable `$block-padding` from
 * `packages/block-editor/src/components/dimension-control/sizes.js`.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export default [
	{
		name: __( 'None' ),
		size: 0,
		slug: 'none',
	},
	{
		name: __( 'Small' ),
		size: 14,
		slug: 'small',
	},
	{
		name: __( 'Medium' ),
		size: 24,
		slug: 'medium',
	},
	{
		name: __( 'Large' ),
		size: 34,
		slug: 'large',
	}, {
		name: __( 'Huge' ),
		size: 60,
		slug: 'huge',
	},
];
