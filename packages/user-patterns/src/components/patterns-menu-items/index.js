/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PatternConvertButton from './pattern-convert-button';

function PatternsMenuItems( { clientIds, rootClientId } ) {
	return (
		<PatternConvertButton
			clientIds={ clientIds }
			rootClientId={ rootClientId }
		/>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( blockEditorStore );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( PatternsMenuItems );
