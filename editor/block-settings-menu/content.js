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
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { isEditorSidebarOpened, getBlockMode, getBlock } from '../selectors';
import { removeBlocks, toggleSidebar, setActivePanel, toggleBlockMode } from '../actions';

export function BlockSettingsMenuContent( { blockType, mode, uids, isSidebarOpened, onDelete, onToggleSidebar, onShowInspector, onToggleMode, onClose } ) {
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
			{ count === 1 && blockType && blockType.supportHTML !== false &&
				<IconButton
					className="editor-block-settings-menu__control"
					onClick={ flow( onToggleMode, onClose ) }
					icon="html"
				>
					{ mode === 'visual'
						? __( 'Edit as HTML' )
						: __( 'Edit visually' )
					}
				</IconButton>
			}
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
	( state, { uids } ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
		mode: uids.length === 1 ? getBlockMode( state, uids[ 0 ] ) : null,
		blockType: uids.length === 1 ? getBlockType( getBlock( state, uids[ 0 ] ).name ) : null,
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
