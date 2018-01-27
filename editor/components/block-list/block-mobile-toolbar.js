/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockRemoveButton from '../block-settings-menu/block-remove-button';
import BlockSettingsMenu from '../block-settings-menu';

function BlockMobileToolbar( { uid, renderBlockMenu } ) {
	return (
		<div className="editor-block-list__block-mobile-toolbar">
			<BlockMover uids={ [ uid ] } />
			<BlockRemoveButton uids={ [ uid ] } small />
			<BlockSettingsMenu uids={ [ uid ] } renderBlockMenu={ renderBlockMenu } />
		</div>
	);
}

export default BlockMobileToolbar;
