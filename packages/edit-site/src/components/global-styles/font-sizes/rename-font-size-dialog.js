/**
 * WordPress dependencies
 */
import {
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	Button,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

function RenameFontSizeDialog( { fontSize, toggleOpen, handleRename } ) {
	const [ newName, setNewName ] = useState( fontSize.name );

	const handleConfirm = () => {
		// If the new name is not empty, call the handleRename function
		if ( newName.trim() ) {
			handleRename( newName );
		}
		toggleOpen();
	};

	return (
		<Modal
			onRequestClose={ toggleOpen }
			focusOnMount="firstContentElement"
			title={ __( 'Rename' ) }
			size="small"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					handleConfirm();
					toggleOpen();
				} }
			>
				<VStack spacing="3">
					<InputControl
						__next40pxDefaultSize
						autoComplete="off"
						value={ newName }
						onChange={ setNewName }
						label={ __( 'Name' ) }
						placeholder={ __( 'Font size preset name' ) }
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ toggleOpen }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}

export default RenameFontSizeDialog;
