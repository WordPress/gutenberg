/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';
import NavigableToolbar from '../navigable-toolbar';

function BlockToolbar( { blockClientIds, isValid, mode, focusOnMount } ) {
	if ( blockClientIds.length === 0 ) {
		return null;
	}

	const hasMultiSelection = blockClientIds.length > 1;

	let controls;
	if ( hasMultiSelection ) {
		controls = (
			<MultiBlocksSwitcher />
		);
	} else if ( mode === 'visual' && isValid ) {
		controls = (
			<Fragment>
				<BlockSwitcher clientIds={ blockClientIds } />
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
			</Fragment>
		);
	}

	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className="editor-block-toolbar"
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block Toolbar' ) }
			scopeId={ 'block-' + blockClientIds[ 0 ] }
		>
			{ controls }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</NavigableToolbar>
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
