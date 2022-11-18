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

export function InsertBeforeMenuItem( { onClose } ) {
	const { onInsertBefore, canInsertDefaultBlock } = useContext(
		BlockSettingsDropdownContext
	);

	const { insertBefore } = useSelect( ( select ) => {
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );
		return {
			insertBefore: getShortcutRepresentation(
				'core/block-editor/insert-before'
			),
		};
	}, [] );

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertBefore ) }
			shortcut={ insertBefore }
		>
			{ __( 'Insert before' ) }
		</MenuItem>
	);
}
