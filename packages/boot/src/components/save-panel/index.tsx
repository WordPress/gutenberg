/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useSaveShortcut from './use-save-shortcut';
import LazyEntitiesSavedStates from './lazy-entities-saved-states';

export default function SavePanel() {
	const [ isOpen, setIsOpen ] = useState< boolean >( false );
	useSaveShortcut( {
		openSavePanel: () => setIsOpen( true ),
	} );
	if ( ! isOpen ) {
		return false;
	}
	return (
		<Modal
			className="edit-site-save-panel__modal"
			onRequestClose={ () => setIsOpen( false ) }
			title={ __( 'Review changes' ) }
			size="small"
		>
			<LazyEntitiesSavedStates
				close={ () => setIsOpen( false ) }
				variant="inline"
			/>
		</Modal>
	);
}
