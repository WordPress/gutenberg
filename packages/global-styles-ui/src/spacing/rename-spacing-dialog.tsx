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
import type { SpacingSize } from '@wordpress/global-styles-engine';

interface RenameSpacingDialogProps {
	spacingSize: SpacingSize;
	toggleOpen: () => void;
	handleRename: ( newName: string ) => void;
}

function RenameSpacingDialog( {
	spacingSize,
	toggleOpen,
	handleRename,
}: RenameSpacingDialogProps ) {
	const [ newName, setNewName ] = useState< string | undefined >(
		spacingSize.name
	);

	const handleConfirm = () => {
		if ( newName && newName.trim() !== spacingSize.name ) {
			handleRename( newName.trim() );
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
						value={ newName }
						onChange={ setNewName }
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
