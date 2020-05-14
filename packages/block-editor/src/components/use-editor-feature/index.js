/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Hook that retrieves the setting for the given editor feature.
 *
 * @param {string} featureName The name of the feature.
 *
 * @return {any} Returns the value defined for the setting.
 */
export default function useEditorFeature( featureName ) {
	const setting = useSelect(
		( select ) => {
			const { getSettings } = select( 'core/block-editor' );

			return getSettings()[ featureName ];
		},
		[ featureName ]
	);

	return setting;
}
