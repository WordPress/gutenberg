/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isEditorSidebarOpened } from '../selectors';
import { removeBlocks, toggleSidebar, setActivePanel, toggleBlockMode } from '../actions';

function BlockSettingsMenuContent( { onDelete, isSidebarOpened, onToggleSidebar, onShowInspector, onToggleMode, uids } ) {
	const count = uids.length;
	const toggleInspector = () => {
		onShowInspector();
		if ( ! isSidebarOpened ) {
			onToggleSidebar();
		}
	};

	return (
		<div className="editor-block-settings-menu__content">
			<IconButton
				className="editor-block-settings-menu__control"
				onClick={ toggleInspector }
				icon="admin-generic"
				label={ __( 'Show inspector' ) }
			/>
			<IconButton
				className="editor-block-settings-menu__control"
				onClick={ onDelete }
				icon="trash"
				label={ sprintf( _n( 'Delete the block', 'Delete the %d blocks', count ), count ) }
			/>
			{ count === 1 && <IconButton
				className="editor-block-settings-menu__control"
				onClick={ onToggleMode }
				icon="html"
				label={ __( 'Switch between the visual/text mode' ) }
			/> }
		</div>
	);
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch, ownProps ) => ( {
		onDelete() {
			dispatch( removeBlocks( ownProps.uids ) );
		},
		onShowInspector() {
			dispatch( setActivePanel( 'block' ) );
		},
		onToggleSidebar() {
			dispatch( toggleSidebar() );
		},
		onToggleMode() {
			dispatch( toggleBlockMode( ownProps.uids[ 0 ] ) );
		},
	} )
)( BlockSettingsMenuContent );
