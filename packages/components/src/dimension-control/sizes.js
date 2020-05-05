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
import { __, _x } from '@wordpress/i18n';

/**
 * Finds the correct size object from the provided sizes
 * table by size slug (eg: `medium`)
 *
 * @param  {Array}  sizes containing objects for each size definition
 * @param  {string} slug  a string representation of the size (eg: `medium`)
 * @return {Object}       the matching size definition
 */
export const findSizeBySlug = ( sizes, slug ) =>
	sizes.find( ( size ) => slug === size.slug );

export default [
	{
		name: _x( 'None', 'Object size' ),
		slug: 'none',
	},
	{
		name: _x( 'Small', 'Object size' ),
		slug: 'small',
	},
	{
		name: _x( 'Medium', 'Object size' ),
		slug: 'medium',
	},
	{
		name: _x( 'Large', 'Object size' ),
		slug: 'large',
	},
	{
		name: _x( 'Extra Large', 'Object size' ),
		slug: 'xlarge',
	},
];
