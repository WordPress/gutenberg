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

export default function RenameModal( { onClose, menuTitle, handleSave } ) {
	const [ editedMenuTitle, setEditedMenuTitle ] = useState( menuTitle );

	return (
		<Modal title="Rename" onRequestClose={ onClose }>
			<form>
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
							variant="primary"
							type="submit"
							onClick={ ( e ) => {
								e.preventDefault();
								handleSave( { title: editedMenuTitle } );
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
