/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import './style.scss';
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';

function BlockToolbar( { blockUIDs, isValid, mode } ) {
	if ( blockUIDs.length > 1 ) {
		return (
			<div className="editor-block-toolbar">
				<MultiBlocksSwitcher />
			</div>
		);
	}

	if ( ! isValid || 'visual' !== mode ) {
		return null;
	}

	return (
		<div className="editor-block-toolbar">
			<BlockSwitcher uids={ blockUIDs } />
			<BlockControls.Slot />
			<BlockFormatControls.Slot />
		</div>
	);
}

export default withSelect( ( select ) => {
	const { getSelectedBlock, getBlockMode, getMultiSelectedBlockUids } = select( 'core/editor' );
	const block = getSelectedBlock();
	const blockUIDs = block ? [ block.uid ] : getMultiSelectedBlockUids();

	return {
		blockUIDs,
		isValid: block ? block.isValid : null,
		mode: block ? getBlockMode( block.uid ) : null,
	};
} )( BlockToolbar );
