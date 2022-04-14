/**
 * WordPress dependencies
 */
import {
	BlockTitle,
	BlockMover,
	BlockIcon,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';

function BlockListExplodedTopToolbar( { clientId } ) {
	const { icon } = useBlockDisplayInformation( clientId );

	return (
		<div className="edit-site-block-list-exploded__item-top-toolbar">
			<span className="edit-site-block-list-exploded__item-title">
				<BlockIcon icon={ icon } showColors />
				<BlockTitle clientId={ clientId } />
			</span>
			<BlockMover clientIds={ [ clientId ] } hideDragHandle />
		</div>
	);
}

export default BlockListExplodedTopToolbar;
