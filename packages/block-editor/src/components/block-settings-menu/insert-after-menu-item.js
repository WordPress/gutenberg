/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { BlockSettingsDropdownContext } from './block-settings-dropdown';

export function InsertAfterMenuItem( { onClose } ) {
	const { onInsertAfter, canInsertDefaultBlock } = useContext(
		BlockSettingsDropdownContext
	);

	const { insertAfter } = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			insertAfter: getShortcutRepresentation(
				'core/block-editor/insert-after'
			),
		};
	}, [] );

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertAfter ) }
			shortcut={ insertAfter }
		>
			{ __( 'Insert after' ) }
		</MenuItem>
	);
}
