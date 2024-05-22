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

export default function useSpacingSizes() {
	const [
		customSizes,
		themeSizes,
		defaultSizes,
		defaultSpacingSizesEnabled,
	] = useSettings(
		'spacing.spacingSizes.custom',
		'spacing.spacingSizes.theme',
		'spacing.spacingSizes.default',
		'spacing.defaultSpacingSizes'
	);

	const maybeDefaultSizes =
		defaultSpacingSizesEnabled !== false ? defaultSizes : null;

	return useMemo( () => {
		const zeroSize = [ { name: 0, slug: '0', size: 0 } ];

		const sizesLength =
			zeroSize.length +
			( customSizes?.length ?? 0 ) +
			( themeSizes?.length ?? 0 ) +
			( maybeDefaultSizes?.length ?? 0 );

		const maybeUnsetSize =
			sizesLength > RANGE_CONTROL_MAX_SIZE
				? [
						{
							name: __( 'Default' ),
							slug: 'default',
							size: undefined,
						},
				  ]
				: null;

		return [
			...maybeUnsetSize,
			...zeroSize,
			...customSizes,
			...themeSizes,
			...maybeDefaultSizes,
		];
	}, [ customSizes, themeSizes, maybeDefaultSizes ] );
}
