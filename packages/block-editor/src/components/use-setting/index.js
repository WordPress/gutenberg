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

const blockedPaths = [ 'color', 'border', 'typography', 'spacing' ];

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
	'typography.lineHeight': ( settings ) => settings.enableCustomLineHeight,
	'spacing.units': ( settings ) => {
		if ( settings.enableCustomUnits === undefined ) {
			return;
		}

		if ( settings.enableCustomUnits === true ) {
			return [ 'px', 'em', 'rem', 'vh', 'vw', '%' ];
		}

		return settings.enableCustomUnits;
	},
	'spacing.padding': ( settings ) => settings.enableCustomSpacing,
};

const prefixedFlags = {
	/*
	 * These were only available in the plugin
	 * and can be removed when the minimum WordPress version
	 * for the plugin is 5.9.
	 */
	'border.customColor': 'border.color',
	'border.customStyle': 'border.style',
	'border.customWidth': 'border.width',
	'typography.customFontStyle': 'typography.fontStyle',
	'typography.customFontWeight': 'typography.fontWeight',
	'typography.customLetterSpacing': 'typography.letterSpacing',
	'typography.customTextDecorations': 'typography.textDecoration',
	'typography.customTextTransforms': 'typography.textTransform',
	/*
	 * These were part of WordPress 5.8 and we need to keep them.
	 */
	'border.customRadius': 'border.radius',
	'spacing.customMargin': 'spacing.margin',
	'spacing.customPadding': 'spacing.padding',
	'typography.customLineHeight': 'typography.lineHeight',
};

/**
 * Remove `custom` prefixes for flags that did not land in 5.8.
 *
 * This provides continued support for `custom` prefixed properties. It will
 * be removed once third party devs have had sufficient time to update themes,
 * plugins, etc.
 *
 * @see https://github.com/WordPress/gutenberg/pull/34485
 *
 * @param {string} path Path to desired value in settings.
 * @return {string}     The value for defined setting.
 */
const removeCustomPrefixes = ( path ) => {
	return prefixedFlags[ path ] || path;
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
			if ( blockedPaths.includes( path ) ) {
				// eslint-disable-next-line no-console
				console.warn(
					'Top level useSetting paths are disabled. Please use a subpath to query the information needed.'
				);
				return undefined;
			}
			const settings = select( blockEditorStore ).getSettings();

			// 1 - Use __experimental features, if available.
			// We cascade to the all value if the block one is not available.
			const normalizedPath = removeCustomPrefixes( path );
			const defaultsPath = `__experimentalFeatures.${ normalizedPath }`;
			const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ normalizedPath }`;
			const experimentalFeaturesResult =
				get( settings, blockPath ) ?? get( settings, defaultsPath );

			if ( experimentalFeaturesResult !== undefined ) {
				if ( PATHS_WITH_MERGE[ normalizedPath ] ) {
					return (
						experimentalFeaturesResult.custom ??
						experimentalFeaturesResult.theme ??
						experimentalFeaturesResult.default
					);
				}
				return experimentalFeaturesResult;
			}

			// 2 - Use deprecated settings, otherwise.
			const deprecatedSettingsValue = deprecatedFlags[ normalizedPath ]
				? deprecatedFlags[ normalizedPath ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return deprecatedSettingsValue;
			}

			// 3 - Fall back for typography.dropCap:
			// This is only necessary to support typography.dropCap.
			// when __experimentalFeatures are not present (core without plugin).
			// To remove when __experimentalFeatures are ported to core.
			return normalizedPath === 'typography.dropCap' ? true : undefined;
		},
		[ blockName, path ]
	);

	return setting;
}
