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
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Size } from './types';

/**
 * Finds the correct size object from the provided sizes
 * table by size slug (eg: `medium`)
 *
 * @param sizes containing objects for each size definition.
 * @param slug  a string representation of the size (eg: `medium`).
 */
export const findSizeBySlug = ( sizes: Size[], slug: string ) =>
	sizes.find( ( size ) => slug === size.slug );

export default [
	{
		name: _x( 'None', 'Size of a UI element' ),
		slug: 'none',
	},
	{
		name: _x( 'Small', 'Size of a UI element' ),
		slug: 'small',
	},
	{
		name: _x( 'Medium', 'Size of a UI element' ),
		slug: 'medium',
	},
	{
		name: _x( 'Large', 'Size of a UI element' ),
		slug: 'large',
	},
	{
		name: _x( 'Extra Large', 'Size of a UI element' ),
		slug: 'xlarge',
	},
];
