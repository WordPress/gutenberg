/**
 * External dependencies
 */
import { flow, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withSpokenMessages } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

export function BlockInspectorButton( {
	areAdvancedSettingsOpened,
	closeSidebar,
	openEditorSidebar,
	onClick = noop,
	small = false,
	speak,
	...props
} ) {
	const speakMessage = () => {
		if ( areAdvancedSettingsOpened ) {
			speak( __( 'Advanced settings closed' ) );
		} else {
			speak( __( 'Additional settings are now available in the Editor advanced settings sidebar' ) );
		}
	};

	const label = areAdvancedSettingsOpened ? __( 'Hide Advanced Settings' ) : __( 'Show Advanced Settings' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( areAdvancedSettingsOpened ? closeSidebar : openEditorSidebar, speakMessage, onClick ) }
			icon="admin-generic"
			label={ small ? label : undefined }
			{ ...props }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		areAdvancedSettingsOpened: select( 'core/edit-post' ).getActiveGeneralSidebarName() === 'edit-post/block',
	} ) ),
	withDispatch( ( dispatch ) => ( {
		openEditorSidebar: () => dispatch( 'core/edit-post' ).openGeneralSidebar( 'edit-post/block' ),
		closeSidebar: dispatch( 'core/edit-post' ).closeGeneralSidebar,
	} ) ),
	withSpokenMessages,
)( BlockInspectorButton );
