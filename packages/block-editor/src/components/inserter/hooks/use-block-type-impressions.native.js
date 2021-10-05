/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

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
			updateSettings( {
				impressions: updatedBlockTypeImpressions,
			} );
		}
	};

	return { items, trackBlockTypeSelected };
}

export default useBlockTypeImpressions;
