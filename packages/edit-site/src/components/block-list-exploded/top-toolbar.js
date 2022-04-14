/**
 * WordPress dependencies
 */
import {
	BlockTitle,
	BlockMover,
	BlockLockToolbar,
	BlockIcon,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';

function BlockListExplodedTopToolbar( { clientId } ) {
	const { icon } = useBlockDisplayInformation( clientId );

	return (
		<div className="edit-site-block-list-exploded__item-top-toolbar">
			<BlockIcon icon={ icon } showColors />
			<span>
				<BlockTitle clientId={ clientId } />
			</span>
			<BlockLockToolbar clientId={ clientId } />
			<BlockMover clientIds={ [ clientId ] } hideDragHandle />
		</div>
	);
}

export default BlockListExplodedTopToolbar;
