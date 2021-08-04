/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { setBlockTypeImpressions } from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

function useBlockTypeImpressions( blockTypes ) {
	const { blockTypeImpressions, enableEditorOnboarding } = useSelect(
		( select ) => {
			const { getSettings: getBlockEditorSettings } = select(
				blockEditorStore
			);
			const { editorOnboarding, impressions } = getBlockEditorSettings();

			return {
				blockTypeImpressions: impressions,
				enableEditorOnboarding: editorOnboarding,
			};
		},
		[]
	);
	const { updateSettings } = useDispatch( blockEditorStore );

	const items = enableEditorOnboarding
		? blockTypes.map( ( blockType ) => ( {
				...blockType,
				isNew: blockTypeImpressions[ blockType.name ] > 0,
		  } ) )
		: blockTypes;

	const trackBlockTypeSelected = ( { name } ) => {
		if ( blockTypeImpressions[ name ] > 0 ) {
			const updatedBlockTypeImpressions = {
				...blockTypeImpressions,
				[ name ]: 0,
			};
			// Persist block type impression to JavaScript store
			updateSettings( {
				impressions: updatedBlockTypeImpressions,
			} );

			// Persist block type impression count to native app store
			setBlockTypeImpressions( updatedBlockTypeImpressions );
		}
	};

	return { items, trackBlockTypeSelected };
}

export default useBlockTypeImpressions;
