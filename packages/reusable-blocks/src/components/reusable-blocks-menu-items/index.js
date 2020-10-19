/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlockDeleteButton from './reusable-block-delete-button';

function ReusableBlocksMenuItems( { clientIds, rootClientId } ) {
	return (
		<>
			<ReusableBlockConvertButton
				clientIds={ clientIds }
				rootClientId={ rootClientId }
			/>
			{ clientIds.length === 1 && (
				<ReusableBlockDeleteButton clientId={ clientIds[ 0 ] } />
			) }
		</>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlockClientIds } = select( 'core/block-editor' );
	return {
		clientIds: getSelectedBlockClientIds(),
	};
} )( ReusableBlocksMenuItems );
