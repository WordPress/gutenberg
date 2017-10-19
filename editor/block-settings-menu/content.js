/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockModeToggle from './block-mode-toggle';
import { isEditorSidebarOpened } from '../selectors';
import { removeBlocks, toggleSidebar, setActivePanel } from '../actions';

export function BlockSettingsMenuContent( { uids, isSidebarOpened, onDelete, onToggleSidebar, onShowInspector, onClose } ) {
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
				onClick={ flow( toggleInspector, onClose ) }
				icon="admin-generic"
			>
				{ __( 'Settings' ) }
			</IconButton>
			{ count === 1 && <BlockModeToggle uid={ uids[ 0 ] } onToggle={ onClose } /> }
			<IconButton
				className="editor-block-settings-menu__control"
				onClick={ flow( onDelete ) }
				icon="trash"
			>
				{ __( 'Delete' ) }
			</IconButton>
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
	} )
)( BlockSettingsMenuContent );
