/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockListExplodedItem from './item';

function BlockListExploded() {
	const blockOrder = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder();
	}, [] );

	return (
		<div className="edit-site-block-list-exploded">
			{ blockOrder.map( ( clientId ) => (
				<BlockListExplodedItem key={ clientId } clientId={ clientId } />
			) ) }
		</div>
	);
}

export default BlockListExploded;
