/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	PanelBody,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

export default function DeleteMenu( { onDeleteMenu, isMenuBeingDeleted } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const handleConfirm = () => {
		setShowConfirmDialog( false );
		onDeleteMenu();
	};

	return (
		<PanelBody>
			<>
				<Button
					className="edit-navigation-inspector-additions__delete-menu-button"
					variant="secondary"
					isDestructive
					isBusy={ isMenuBeingDeleted }
					onClick={ () => {
						setShowConfirmDialog( true );
					} }
				>
					{ __( 'Delete menu' ) }
				</Button>
				<ConfirmDialog
					isOpen={ showConfirmDialog }
					onConfirm={ handleConfirm }
					onCancel={ () => setShowConfirmDialog( false ) }
				>
					{ __(
						'Are you sure you want to delete this navigation? This action cannot be undone.'
					) }
				</ConfirmDialog>
			</>
		</PanelBody>
	);
}
