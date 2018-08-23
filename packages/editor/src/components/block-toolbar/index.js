/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { Toolbar, ResponsiveToolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

function BlockToolbar( { blockClientIds, isValid, mode } ) {
	if ( blockClientIds.length > 1 ) {
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
			<ResponsiveToolbar
				className="editor-block-toolbar__tools"
				extraContentClassName="editor-block-toolbar__tools-dropdown"
				renderToggle={ ( { onToggle, isOpen } ) => (
					<Toolbar controls={ [ {
						icon: 'arrow-down-alt2',
						title: __( 'More Tools' ),
						onClick: onToggle,
						extraProps: { 'aria-expanded': isOpen },
					} ] } />
				) }
			>
				<BlockSwitcher clientIds={ blockClientIds } />
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
			</ResponsiveToolbar>
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
