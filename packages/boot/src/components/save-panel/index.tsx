import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';
import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import useSaveShortcut from './use-save-shortcut';
import { unlock } from '../../lock-unlock';
import styles from './style.module.scss';

const { EntitiesSavedStates } = unlock( coreDataPrivateApis );

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
