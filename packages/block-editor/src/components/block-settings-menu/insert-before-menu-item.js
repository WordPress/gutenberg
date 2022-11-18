/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pipe } from '@wordpress/compose';
/**
 * Internal dependencies
 */
import { BlockSettingsDropdownContext } from './block-settings-dropdown';

export function InsertBeforeMenuItem( { onClose } ) {
	const { shortcuts, onInsertBefore, canInsertDefaultBlock } = useContext(
		BlockSettingsDropdownContext
	);

	if ( ! canInsertDefaultBlock ) {
		return null;
	}

	return (
		<MenuItem
			onClick={ pipe( onClose, onInsertBefore ) }
			shortcut={ shortcuts.insertBefore }
		>
			{ __( 'Insert before' ) }
		</MenuItem>
	);
}
