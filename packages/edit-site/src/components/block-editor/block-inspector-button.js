/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

export default function BlockInspectorButton( { onClick = () => {} } ) {
	const { shortcut, isBlockInspectorOpen } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation( 'core/editor/toggle-sidebar' ),
			isBlockInspectorOpen:
				select( interfaceStore ).getActiveComplementaryArea(
					'core'
				) === 'edit-post/block',
		} ),
		[]
	);
	const { enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );

	const label = isBlockInspectorOpen
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	return (
		<MenuItem
			onClick={ () => {
				if ( isBlockInspectorOpen ) {
					disableComplementaryArea( 'core' );
					speak( __( 'Block settings closed' ) );
				} else {
					enableComplementaryArea( 'core', 'edit-post/block' );
					speak(
						__(
							'Additional settings are now available in the Editor block settings sidebar'
						)
					);
				}
				// Close dropdown menu.
				onClick();
			} }
			shortcut={ shortcut }
		>
			{ label }
		</MenuItem>
	);
}
