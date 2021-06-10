/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { speak } from '@wordpress/a11y';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export function BlockInspectorButton( { onClick = noop, small = false } ) {
	const { shortcut, areAdvancedSettingsOpened } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/edit-post/toggle-sidebar' ),
			areAdvancedSettingsOpened:
				select( editPostStore ).getActiveGeneralSidebarName() ===
				'edit-post/block',
		} ),
		[]
	);
	const { openGeneralSidebar, closeGeneralSidebar } = useDispatch(
		editPostStore
	);

	const label = areAdvancedSettingsOpened
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return (
		<MenuItem
			onClick={ () => {
				if ( areAdvancedSettingsOpened ) {
					closeGeneralSidebar();
					speak( __( 'Block settings closed' ) );
				} else {
					openGeneralSidebar( 'edit-post/block' );
					speak(
						__(
							'Additional settings are now available in the Editor block settings sidebar'
						)
					);
				}
				onClick();
			} }
			shortcut={ shortcut }
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default BlockInspectorButton;
