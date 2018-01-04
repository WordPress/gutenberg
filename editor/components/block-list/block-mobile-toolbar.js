/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockDeleteButton from '../block-settings-menu/block-delete-button';
import BlockSettingsMenu from '../block-settings-menu';

function BlockMobileToolbar( { uid } ) {
	return (
		<div className="editor-block-list__block-mobile-toolbar">
			<BlockMover uids={ [ uid ] } />
			<BlockDeleteButton uids={ [ uid ] } small />
			<BlockSettingsMenu uids={ [ uid ] } />
		</div>
	);
}

export default BlockMobileToolbar;
