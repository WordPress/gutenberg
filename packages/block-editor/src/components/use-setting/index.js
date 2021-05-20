/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit';
import { store as blockEditorStore } from '../../store';

const deprecatedFlags = {
	'color.palette': ( settings ) =>
		settings.colors === undefined ? undefined : settings.colors,
	'color.gradients': ( settings ) =>
		settings.gradients === undefined ? undefined : settings.gradients,
	'color.custom': ( settings ) =>
		settings.disableCustomColors === undefined
			? undefined
			: ! settings.disableCustomColors,
	'color.customGradient': ( settings ) =>
		settings.disableCustomGradients === undefined
			? undefined
			: ! settings.disableCustomGradients,
	'typography.fontSizes': ( settings ) =>
		settings.fontSizes === undefined ? undefined : settings.fontSizes,
	'typography.customFontSize': ( settings ) =>
		settings.disableCustomFontSizes === undefined
			? undefined
			: ! settings.disableCustomFontSizes,
	'typography.customLineHeight': ( settings ) =>
		settings.enableCustomLineHeight,
	'spacing.units': ( settings ) => {
		if ( settings.enableCustomUnits === undefined ) {
			return;
		}

		if ( settings.enableCustomUnits === true ) {
			return [ 'px', 'em', 'rem', 'vh', 'vw' ];
		}

		return settings.enableCustomUnits;
	},
	'spacing.customPadding': ( settings ) => settings.enableCustomSpacing,
};

const filterColorsFromCoreOrigin = ( path, setting ) => {
	if ( path !== 'color.palette' && path !== 'color.gradients' ) {
		return setting;
	}

	if ( ! Array.isArray( setting ) ) {
		return setting;
	}

	const colors = setting.filter( ( color ) => color?.origin !== 'core' );

	return colors.length > 0 ? colors : setting;
};

/**
 * Hook that retrieves the editor setting.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string} path The path to the setting.
 *
 * @return {any} Returns the value defined for the setting.
 *
 * @example
 * ```js
 * const isEnabled = useSetting( 'typography.dropCap' );
 * ```
 */
export default function useSetting( path ) {
	const { name: blockName } = useBlockEditContext();

	const setting = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();

			// 1 - Use __experimental features, if available.
			// We cascade to the all value if the block one is not available.
			const defaultsPath = `__experimentalFeatures.${ path }`;
			const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ path }`;
			const experimentalFeaturesResult =
				get( settings, blockPath ) ?? get( settings, defaultsPath );
			if ( experimentalFeaturesResult !== undefined ) {
				return filterColorsFromCoreOrigin(
					path,
					experimentalFeaturesResult
				);
			}

			// 2 - Use deprecated settings, otherwise.
			const deprecatedSettingsValue = deprecatedFlags[ path ]
				? deprecatedFlags[ path ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return filterColorsFromCoreOrigin(
					path,
					deprecatedSettingsValue
				);
			}

			// 3 - Fall back for typography.dropCap:
			// This is only necessary to support typography.dropCap.
			// when __experimentalFeatures are not present (core without plugin).
			// To remove when __experimentalFeatures are ported to core.
			return path === 'typography.dropCap' ? true : undefined;
		},
		[ blockName, path ]
	);

	return setting;
}
