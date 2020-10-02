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
};

/**
 * Hook that retrieves the setting for the given editor feature.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string} featurePath  The path to the feature.
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
			// 1 - Use deprecated settings, if available.
			const settings = select( 'core/block-editor' ).getSettings();
			const deprecatedSettingsValue = deprecatedFlags[ featurePath ]
				? deprecatedFlags[ featurePath ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return deprecatedSettingsValue;
			}

			// 2 - Use __experimental features otherwise.
			// We cascade to the global value if the block one is not available.
			//
			// TODO: make it work for blocks that define multiple selectors
			// such as core/heading or core/post-title.
			const globalPath = `__experimentalFeatures.global.${ featurePath }`;
			const blockPath = `__experimentalFeatures.${ blockName }.${ featurePath }`;
			return get( settings, blockPath ) ?? get( settings, globalPath );
		},
		[ blockName, featurePath ]
	);

	return setting;
}
