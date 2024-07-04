/**
 * WordPress dependencies
 */
import {
	__experimentalInputControl as InputControl,
	__experimentalSpacer as Spacer,
	Button,
	Flex,
	FlexItem,
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
				<InputControl
					autoComplete="off"
					value={ newName }
					onChange={ setNewName }
					label={ __( 'Name' ) }
					placeholder={ __( 'Font size preset name' ) }
				/>
				<Spacer marginBottom={ 6 } />
				<Flex justify="flex-end" expanded={ false }>
					<FlexItem>
						<Button variant="tertiary" onClick={ toggleOpen }>
							{ __( 'Cancel' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button variant="primary" type="submit">
							{ __( 'Save' ) }
						</Button>
					</FlexItem>
				</Flex>
			</form>
		</Modal>
	);
}

export default RenameFontSizeDialog;
