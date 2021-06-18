/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlocksManageButton from './reusable-blocks-manage-button';

function ReusableBlocksMenuItems( { clientIds, rootClientId } ) {
	return (
		<>
			<ReusableBlockConvertButton
				clientIds={ clientIds }
				rootClientId={ rootClientId }
			/>
			{ clientIds.length === 1 && (
				<ReusableBlocksManageButton clientId={ clientIds[ 0 ] } />
			) }
		</>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( blockEditorStore );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ReusableBlocksMenuItems );
