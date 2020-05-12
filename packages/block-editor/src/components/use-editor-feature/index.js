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

/**
 * Hook that retrieves the setting for the given editor feature.
 * It works with nested objects using by finding the value at path.
 *
 * @param {string} featurePath  The path to the feature.
 * @param {*}      defaultValue Default value to return if not
 *                              explicitly defined.
 *
 * @return {any} Returns the value defined for the setting.
 *
 * @example
 * ```js
 * const isEnabled = useEditorFeature( 'typography.dropCap', false );
 * ```
 */
export default function useEditorFeature( featurePath, defaultValue ) {
	const { name: blockName } = useBlockEditContext();
	const path = `__experimentalFeatures.${ featurePath }`;

	const setting = useSelect(
		( select ) => {
			const { getBlockSupport } = select( 'core/blocks' );

			const blockSupportValue = getBlockSupport( blockName, path );
			if ( blockSupportValue !== undefined ) {
				return blockSupportValue;
			}

			const { getSettings } = select( 'core/block-editor' );

			return get( getSettings(), path, defaultValue );
		},
		[ blockName, path ]
	);

	return setting;
}
