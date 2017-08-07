/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { isEditorSidebarOpened } from '../selectors';
import { selectBlock } from '../actions';

function BlockSettingsMenu( { onDelete, onSelect, isSidebarOpened, toggleSidebar, setActivePanel } ) {
	const toggleInspector = () => {
		onSelect();
		setActivePanel();
		if ( ! isSidebarOpened ) {
			toggleSidebar();
		}
	};

	return (
		<div className="editor-block-settings-menu">
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
				label={ __( 'Delete the block' ) }
			/>
		</div>
	);
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
	} ),
	( dispatch, ownProps ) => ( {
		onDelete() {
			dispatch( {
				type: 'REMOVE_BLOCKS',
				uids: [ ownProps.uid ],
			} );
		},
		onSelect() {
			dispatch( selectBlock( ownProps.uid ) );
		},
		setActivePanel() {
			dispatch( {
				type: 'SET_ACTIVE_PANEL',
				panel: 'block',
			} );
		},
		toggleSidebar() {
			dispatch( { type: 'TOGGLE_SIDEBAR' } );
		},
	} )
)( BlockSettingsMenu );
