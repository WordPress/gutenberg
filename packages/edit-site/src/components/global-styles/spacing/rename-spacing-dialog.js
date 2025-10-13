/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Modal,
	__experimentalInputControl as InputControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

function RenameSpacingDialog( { spacingSize, toggleOpen, handleRename } ) {
	const [ editedName, setEditedName ] = useState( spacingSize.name );

	const handleConfirm = () => {
		if ( editedName !== spacingSize.name ) {
			handleRename( editedName );
		}
		toggleOpen();
	};

	const handleCancel = () => {
		toggleOpen();
	};

	return (
		<Modal
			title={ __( 'Rename spacing size' ) }
			onRequestClose={ toggleOpen }
			focusOnMount="firstContentElement"
			size="medium"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					handleConfirm();
				} }
			>
				<VStack spacing={ 3 }>
					<InputControl
						__next40pxDefaultSize
						autoComplete="off"
						value={ editedName }
						onChange={ setEditedName }
						label={ __( 'Name' ) }
						placeholder={ __( 'Spacing size preset name' ) }
						help={ sprintf(
							/* translators: %s: spacing size preset slug. */
							__(
								'Spacing size slug is %s and cannot be changed.'
							),
							spacingSize.slug
						) }
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ handleCancel }
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

export default RenameSpacingDialog;
