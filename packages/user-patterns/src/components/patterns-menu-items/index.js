/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import UserPatternConvertButton from './pattern-convert-button';

function UserPatternsMenuItems( { clientIds, rootClientId } ) {
	return (
		<UserPatternConvertButton
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
} )( UserPatternsMenuItems );
