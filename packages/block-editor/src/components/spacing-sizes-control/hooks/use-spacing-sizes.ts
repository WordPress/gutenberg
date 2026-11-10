import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSettings } from '../../use-settings';
import { RANGE_CONTROL_MAX_SIZE } from '../utils';
import type { SpacingSize } from '../types';

const EMPTY_ARRAY: SpacingSize[] = [];

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

	// The spacing size settings hold presets.
	const customSizes =
		( customSpacingSizes as SpacingSize[] | undefined ) ?? EMPTY_ARRAY;

	const themeSizes =
		( themeSpacingSizes as SpacingSize[] | undefined ) ?? EMPTY_ARRAY;

	const defaultSizes =
		defaultSpacingSizes && defaultSpacingSizesEnabled !== false
			? ( defaultSpacingSizes as SpacingSize[] )
			: EMPTY_ARRAY;

	return useMemo( () => {
		const sizes: SpacingSize[] = [
			{ name: __( 'None' ), slug: '0', size: 0 },
			...customSizes,
			...themeSizes,
			...defaultSizes,
		];

		// Using numeric slugs opts-in to sorting by slug.
		// `test` and `compare` read numeric slugs as strings.
		if ( sizes.every( ( { slug } ) => /^[0-9]/.test( slug as string ) ) ) {
			sizes.sort( ( a, b ) =>
				compare( a.slug as string, b.slug as string )
			);
		}

		return sizes.length > RANGE_CONTROL_MAX_SIZE
			? [
					{
						name: __( 'Default' ),
						slug: 'default',
						size: undefined,
					},
					...sizes,
				]
			: sizes;
	}, [ customSizes, themeSizes, defaultSizes ] );
}
