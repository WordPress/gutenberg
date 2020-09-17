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
	'color.custom': ( settings ) =>
		settings.disableCustomColors === undefined
			? undefined
			: ! settings.disableCustomColors,
	'gradient.custom': ( settings ) =>
		settings.disableCustomGradients === undefined
			? undefined
			: ! settings.disableCustomGradients,
	'fontSize.custom': ( settings ) =>
		settings.disableCustomFontSizes === undefined
			? undefined
			: ! settings.disableCustomFontSizes,
	'lineHeight.custom': ( settings ) => settings.enableCustomLineHeight,
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
