/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { MenuItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { STORE_NAME } from '../../store/constants';
import { SIDEBAR_BLOCK } from '../sidebar/constants';

export default function BlockInspectorButton( { blocks, onClick = () => {} } ) {
	const { isBlockSelected } = useSelect( blockEditorStore );
	const { shortcut, isBlockInspectorOpen } = useSelect(
		( select ) => ( {
			shortcut: select(
				keyboardShortcutsStore
			).getShortcutRepresentation(
				'core/edit-site/toggle-block-settings-sidebar'
			),
			isBlockInspectorOpen:
				select( interfaceStore ).getActiveComplementaryArea(
					editSiteStore.name
				) === SIDEBAR_BLOCK,
		} ),
		[]
	);
	const { enableComplementaryArea, disableComplementaryArea } = useDispatch(
		interfaceStore
	);

	const label = isBlockInspectorOpen
		? __( 'Hide more settings' )
		: __( 'Show more settings' );

	// If blocks are passed to this component then check whether any of the blocks are selected.
	if ( blocks ) {
		// If none of the blocks are selected then don't show this option.
		if (
			blocks.filter( ( block ) => isBlockSelected( block.clientId ) )
				.length === 0
		) {
			return null;
		}
	}

	return (
		<MenuItem
			onClick={ () => {
				if ( isBlockInspectorOpen ) {
					disableComplementaryArea( STORE_NAME );
					speak( __( 'Block settings closed' ) );
				} else {
					enableComplementaryArea( STORE_NAME, SIDEBAR_BLOCK );
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
