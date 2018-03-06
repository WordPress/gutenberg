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
import { getActiveGeneralSidebarName, isEditorSidebarOpened } from '../../store/selectors';
import { openGeneralSidebar } from '../../store/actions';

export function BlockInspectorButton( {
	isEditorSidebarOpen,
	onOpenGeneralSidebarEditor,
	activeSidebarName,
	onClick = noop,
	small = false,
	speak,
} ) {
	const speakMessage = () => {
		if ( ! isEditorSidebarOpen || ( isEditorSidebarOpen && activeSidebarName !== 'edit-post/block' ) ) {
			speak( __( 'Additional settings are now available in the Editor advanced settings sidebar' ) );
		} else {
			speak( __( 'Advanced settings closed' ) );
		}
	};

	const label = ( isEditorSidebarOpen && activeSidebarName === 'edit-post/block' ) ? __( 'Hide Advanced Settings' ) : __( 'Show Advanced Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onOpenGeneralSidebarEditor, speakMessage, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		isEditorSidebarOpen: isEditorSidebarOpened( state ),
		activeSidebarName: getActiveGeneralSidebarName( state ),
	} ),
	( dispatch ) => ( {
		onOpenGeneralSidebarEditor() {
			dispatch( openGeneralSidebar( 'edit-post/block' ) );
		},
	} ),
	undefined,
	{ storeKey: 'edit-post' }
)( withSpokenMessages( BlockInspectorButton ) );
