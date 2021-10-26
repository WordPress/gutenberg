/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { __EXPERIMENTAL_PATHS_WITH_MERGE as PATHS_WITH_MERGE } from '@wordpress/blocks';

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
			return [ 'px', 'em', 'rem', 'vh', 'vw', '%' ];
		}

		return settings.enableCustomUnits;
	},
	'spacing.customPadding': ( settings ) => settings.enableCustomSpacing,
};

// The following provide continued support for `custom` prefixed properties.
// This will be removed once third party devs have had sufficient time to update
// themes, plugins, etc. This is also separate to the deprecated flags as there
// will be some overlap e.g. `typography.customLineHeight`.
// See: https://github.com/WordPress/gutenberg/pull/34485
const prefixedFlags = {
	'border.customColor': 'border.color',
	'border.customRadius': 'border.radius',
	'border.customStyle': 'border.style',
	'border.customWidth': 'border.width',
	'typography.customFontStyle': 'typography.fontStyle',
	'typography.customFontWeight': 'typography.fontWeight',
	'typography.customLetterSpacing': 'typography.letterSpacing',
	'typography.customTextDecorations': 'typography.textDecoration',
	'typography.customTextTransforms': 'typography.textTransform',
};

/**
 * Retrieve editor setting value. The block specific setting is preferred
 * otherwise falls back to the generic setting path.
 *
 * @param {Object} settings  Editor settings.
 * @param {string} blockName Block to retrieve setting for.
 * @param {string} path      Path to desired value in settings.
 * @return {any}             The value for defined setting.
 */
const getSetting = ( settings, blockName, path ) => {
	const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ path }`;
	const defaultsPath = `__experimentalFeatures.${ path }`;

	return get( settings, blockPath ) ?? get( settings, defaultsPath );
};

/**
 * Hook that retrieves the editor setting.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string} path The path to the setting.
 * @return {any} Returns the value defined for the setting.
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
			const experimentalFeaturesResult = getSetting(
				settings,
				blockName,
				path
			);

			if ( experimentalFeaturesResult !== undefined ) {
				if ( PATHS_WITH_MERGE[ path ] ) {
					return (
						experimentalFeaturesResult.user ??
						experimentalFeaturesResult.theme ??
						experimentalFeaturesResult.core
					);
				}
				return experimentalFeaturesResult;
			}

			// 2 - Handle `custom` prefixed settings.
			const pathWithoutPrefix = prefixedFlags[ path ];

			if ( pathWithoutPrefix ) {
				const settingsValue = getSetting(
					settings,
					blockName,
					pathWithoutPrefix
				);

				if ( settingsValue !== undefined ) {
					return settingsValue;
				}
			}

			// 3 - Use deprecated settings, otherwise.
			const deprecatedSettingsValue = deprecatedFlags[ path ]
				? deprecatedFlags[ path ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return deprecatedSettingsValue;
			}

			// 4 - Fall back for typography.dropCap:
			// This is only necessary to support typography.dropCap.
			// when __experimentalFeatures are not present (core without plugin).
			// To remove when __experimentalFeatures are ported to core.
			return path === 'typography.dropCap' ? true : undefined;
		},
		[ blockName, path ]
	);

	return setting;
}
