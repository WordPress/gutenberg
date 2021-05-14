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

/**
 * Hook that retrieves the setting for the given editor feature.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string} featurePath The path to the feature.
 *
 * @return {any} Returns the value defined for the setting.
 *
 * @example
 * ```js
 * const isEnabled = useEditorFeature( 'typography.dropCap' );
 * ```
 */
export default function useEditorFeature( featurePath ) {
	const { name: blockName } = useBlockEditContext();

	const setting = useSelect(
		( select ) => {
			const settings = select( blockEditorStore ).getSettings();

			// 1 - Use __experimental features, if available.
			// We cascade to the all value if the block one is not available.
			const defaultsPath = `__experimentalFeatures.${ featurePath }`;
			const blockPath = `__experimentalFeatures.blocks.${ blockName }.${ featurePath }`;
			const experimentalFeaturesResult =
				get( settings, blockPath ) ?? get( settings, defaultsPath );
			if ( experimentalFeaturesResult !== undefined ) {
				return experimentalFeaturesResult;
			}

			// 2 - Use deprecated settings, otherwise.
			const deprecatedSettingsValue = deprecatedFlags[ featurePath ]
				? deprecatedFlags[ featurePath ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return deprecatedSettingsValue;
			}

			// 3 - Fall back for typography.dropCap:
			// This is only necessary to support typography.dropCap.
			// when __experimentalFeatures are not present (core without plugin).
			// To remove when __experimentalFeatures are ported to core.
			return featurePath === 'typography.dropCap' ? true : undefined;
		},
		[ blockName, featurePath ]
	);

	return setting;
}
