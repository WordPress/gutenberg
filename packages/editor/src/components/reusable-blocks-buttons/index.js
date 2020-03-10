/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ReusableBlockConvertButton from './reusable-block-convert-button';
import ReusableBlockDeleteButton from './reusable-block-delete-button';

function ReusableBlocksButtons( { clientIds } ) {
	return (
		<>
			<ReusableBlockConvertButton clientIds={ clientIds } />
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
} )( ReusableBlocksButtons );
