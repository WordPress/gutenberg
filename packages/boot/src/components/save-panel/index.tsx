import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import EntitiesSavedStates from '../entities-saved-states';
import useSaveShortcut from './use-save-shortcut';
import styles from './style.module.scss';

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
			className={ styles.modal }
			onRequestClose={ () => setIsOpen( false ) }
			title={ __( 'Review changes' ) }
			size="small"
		>
			<EntitiesSavedStates
				close={ () => setIsOpen( false ) }
				variant="inline"
			/>
		</Modal>
	);
}
