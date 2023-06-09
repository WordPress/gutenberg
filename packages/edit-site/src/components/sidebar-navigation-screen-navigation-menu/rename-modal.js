/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

export default function RenameModal( { menuTitle, onClose, onSave } ) {
	const [ editedMenuTitle, setEditedMenuTitle ] = useState( menuTitle );

	return (
		<Modal title={ __( 'Rename' ) } onRequestClose={ onClose }>
			<form className="sidebar-navigation__rename-modal-form">
				<VStack spacing="3">
					<TextControl
						__nextHasNoMarginBottom
						value={ editedMenuTitle }
						placeholder={ __( 'Navigation title' ) }
						onChange={ setEditedMenuTitle }
					/>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							disabled={ editedMenuTitle === menuTitle }
							variant="primary"
							type="submit"
							onClick={ ( e ) => {
								e.preventDefault();
								onSave( { title: editedMenuTitle } );

								// Immediate close avoids ability to hit save multiple times.
								onClose();
							} }
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
