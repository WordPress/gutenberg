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

function DeleteMenuConfirm( props ) {
	return props.showConfirmDialog ? (
		<ConfirmDialog onConfirm={ props.onDeleteMenu }>
			Are you sure you want to delete this navigation? This action cannot
			be undone.
		</ConfirmDialog>
	) : null;
}

export default function DeleteMenu( { onDeleteMenu, isMenuBeingDeleted } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
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
				<DeleteMenuConfirm
					onDeleteMenu={ onDeleteMenu }
					showConfirmDialog={ showConfirmDialog }
				/>
			</>
		</PanelBody>
	);
}
