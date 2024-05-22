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
		const zeroSize = [ { name: 0, slug: '0', size: 0 } ];

		const sizesLength =
			zeroSize.length +
			customSizes.length +
			themeSizes.length +
			defaultSizes.length;

		const maybeUnsetSize =
			sizesLength > RANGE_CONTROL_MAX_SIZE
				? [
						{
							name: __( 'Default' ),
							slug: 'default',
							size: undefined,
						},
				  ]
				: EMPTY_ARRAY;

		return [
			...maybeUnsetSize,
			...zeroSize,
			...customSizes,
			...themeSizes,
			...defaultSizes,
		];
	}, [ customSizes, themeSizes, defaultSizes ] );
}
