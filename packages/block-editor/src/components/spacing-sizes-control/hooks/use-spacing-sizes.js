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

const UNSET_SIZE = [
	{
		name: __( 'Default' ),
		slug: 'default',
		size: undefined,
	},
];

export default function useSpacingSizes() {
	const [
		customSizes = EMPTY_ARRAY,
		themeSizes = EMPTY_ARRAY,
		defaultSizes = EMPTY_ARRAY,
		defaultSpacingSizesEnabled,
	] = useSettings(
		'spacing.spacingSizes.custom',
		'spacing.spacingSizes.theme',
		'spacing.spacingSizes.default',
		'spacing.defaultSpacingSizes'
	);

	const maybeDefaultSizes =
		defaultSpacingSizesEnabled !== false ? defaultSizes : EMPTY_ARRAY;

	return useMemo( () => {
		const sizesLength =
			( customSizes?.length ?? 0 ) +
			( themeSizes?.length ?? 0 ) +
			( maybeDefaultSizes?.length ?? 0 );

		const maybeUnsetSize =
			sizesLength > RANGE_CONTROL_MAX_SIZE ? UNSET_SIZE : EMPTY_ARRAY;

		return [
			...maybeUnsetSize,
			{ name: 0, slug: '0', size: 0 },
			...customSizes,
			...themeSizes,
			...maybeDefaultSizes,
		];
	}, [ customSizes, themeSizes, maybeDefaultSizes ] );
}
