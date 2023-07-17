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
	const { getSelectedBlockClientIds, getBlockRootClientId } =
		select( blockEditorStore );
	const clientIds = getSelectedBlockClientIds();
	return {
		clientIds,
		rootClientId: clientIds?.length
			? getBlockRootClientId( clientIds[ 0 ] )
			: undefined,
	};
} )( ReusableBlocksMenuItems );
