/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem, withSpokenMessages } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

export function BlockInspectorButton( {
	onClick = noop,
	small = false,
	speak,
} ) {
	const { shortcut, areAdvancedSettingsOpened } = useSelect( ( select ) => ( {
		shortcut: select( 'core/keyboard-shortcuts' ).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
		areAdvancedSettingsOpened: select( 'core/edit-post' ).getActiveGeneralSidebarName() === 'edit-post/block',
	} ), [] );
	const { openGeneralSidebar, closeGeneralSidebar } = useDispatch( 'core/edit-post' );

	const speakMessage = () => {
		if ( areAdvancedSettingsOpened ) {
			speak( __( 'Block settings closed' ) );
		} else {
			speak( __( 'Additional settings are now available in the Editor block settings sidebar' ) );
		}
	};

	const label = areAdvancedSettingsOpened ? __( 'Hide Block Settings' ) : __( 'Show Block Settings' );

	return (
		<MenuItem
			onClick={ () => {
				if ( areAdvancedSettingsOpened ) {
					closeGeneralSidebar();
				} else {
					openGeneralSidebar( 'edit-post/block' );
					speakMessage();
					onClick();
				}
			} }
			icon="admin-generic"
			shortcut={ shortcut }
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default withSpokenMessages( BlockInspectorButton );
