/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

function BlockToolbar( { blockClientIds, isValid, mode } ) {
	if ( blockClientIds.length === 0 ) {
		return null;
	}

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="editor-block-toolbar">
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	return (
		<div className="editor-block-toolbar">
			{ mode === 'visual' && isValid && (
				<Fragment>
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</Fragment>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}

export default withSelect( ( select ) => {
	const {
		getSelectedBlock,
		getBlockMode,
		getMultiSelectedBlockClientIds,
	} = select( 'core/editor' );
	const block = getSelectedBlock();
	const blockClientIds = block ?
		[ block.clientId ] :
		getMultiSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: block ? block.isValid : null,
		mode: block ? getBlockMode( block.clientId ) : null,
	};
} )( BlockToolbar );
