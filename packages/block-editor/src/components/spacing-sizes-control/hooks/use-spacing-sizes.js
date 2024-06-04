/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSettings } from '../../use-settings';
import { RANGE_CONTROL_MAX_SIZE } from '../utils';

const EMPTY_ARRAY = [];

const compare = new Intl.Collator( 'und', { numeric: true } ).compare;

export default function useSpacingSizes() {
	const [
		customSpacingSizes,
		themeSpacingSizes,
		defaultSpacingSizes,
		defaultSpacingSizesEnabled,
	] = useSettings(
		'spacing.spacingSizes.custom',
		'spacing.spacingSizes.theme',
		'spacing.spacingSizes.default',
		'spacing.defaultSpacingSizes'
	);

	const customSizes = customSpacingSizes ?? EMPTY_ARRAY;

	const themeSizes = themeSpacingSizes ?? EMPTY_ARRAY;

	const defaultSizes =
		defaultSpacingSizes && defaultSpacingSizesEnabled !== false
			? defaultSpacingSizes
			: EMPTY_ARRAY;

	return useMemo( () => {
		const sizes = [
			{ name: __( 'None' ), slug: '0', size: 0 },
			...customSizes,
			...themeSizes,
			...defaultSizes,
		].sort( ( a, b ) => compare( a.slug, b.slug ) );

		return sizes.length > RANGE_CONTROL_MAX_SIZE
			? [
					{
						name: __( 'Default' ),
						slug: 'default',
						size: undefined,
					},
					...sizes,
			  ]
			: // See https://github.com/WordPress/gutenberg/pull/44247 for reasoning
			  // to use the index as the name in the range control.
			  sizes.map( ( { slug, size }, i ) => ( { name: i, slug, size } ) );
	}, [ customSizes, themeSizes, defaultSizes ] );
}
