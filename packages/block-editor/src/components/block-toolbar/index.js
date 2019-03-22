/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
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
			<div className="editor-block-toolbar block-editor-block-toolbar">
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	return (
		<div className="editor-block-toolbar block-editor-block-toolbar">
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
		getSelectedBlockClientId,
		getBlockMode,
		getMultiSelectedBlockClientIds,
		isBlockValid,
	} = select( 'core/block-editor' );
	const selectedBlockClientId = getSelectedBlockClientId();
	const blockClientIds = selectedBlockClientId ?
		[ selectedBlockClientId ] :
		getMultiSelectedBlockClientIds();

	return {
		blockClientIds,
		isValid: selectedBlockClientId ? isBlockValid( selectedBlockClientId ) : null,
		mode: selectedBlockClientId ? getBlockMode( selectedBlockClientId ) : null,
	};
} )( BlockToolbar );
