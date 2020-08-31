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
			const path = `__experimentalFeatures.${ featurePath }`;

			// 1 - Use deprecated settings, if available.
			const settings = select( 'core/block-editor' ).getSettings();
			const deprecatedSettingsValue = deprecatedFlags[ featurePath ]
				? deprecatedFlags[ featurePath ]( settings )
				: undefined;
			if ( deprecatedSettingsValue !== undefined ) {
				return deprecatedSettingsValue;
			}

			// 2 - Use global __experimentalFeatures otherwise.
			return get( settings, path );
		},
		[ blockName, featurePath ]
	);

	return setting;
}
