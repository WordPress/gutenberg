/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withSpokenMessages } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { isEditorSidebarOpened, getActivePanel } from '../../selectors';
import { toggleSidebar, setActivePanel } from '../../actions';

export function BlockInspectorButton( {
	isSidebarOpened,
	panel,
	onToggleSidebar,
	onShowInspector,
	onClick = noop,
	small = false,
	speak,
} ) {
	const toggleInspector = () => {
		onShowInspector();
		if ( ! isSidebarOpened || ( isSidebarOpened && panel === 'block' ) ) {
			onToggleSidebar();
		}
	};

	const speakMessage = () => {
		if ( ! isSidebarOpened || ( isSidebarOpened && panel !== 'block' ) ) {
			speak( __( 'Additional settings are now available in the Editor advanced settings sidebar' ) );
		} else {
			speak( __( 'Advanced settings closed' ) );
		}
	};

	const label = ( isSidebarOpened && panel === 'block' ) ? __( 'Hide Advanced Settings' ) : __( 'Show Advanced Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( toggleInspector, speakMessage, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isSidebarOpened: isEditorSidebarOpened( state ),
		panel: getActivePanel( state ),
	} ),
	( dispatch ) => ( {
		onShowInspector() {
			dispatch( setActivePanel( 'block' ) );
		},
		onToggleSidebar() {
			dispatch( toggleSidebar() );
		},
	} )
)( withSpokenMessages( BlockInspectorButton ) );
