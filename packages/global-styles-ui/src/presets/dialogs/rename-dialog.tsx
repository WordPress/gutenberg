import {
	__experimentalInputControl as WCInputControl,
	Button,
	Modal,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

interface RenameDialogProps {
	initialName: string;
	placeholder: string;
	toggleOpen: () => void;
	onRename: ( newName: string ) => void;
}

export default function RenameDialog( {
	initialName,
	placeholder,
	toggleOpen,
	onRename,
}: RenameDialogProps ) {
	const [ newName, setNewName ] = useState< string | undefined >(
		initialName
	);

	const handleConfirm = () => {
		if ( newName && newName.trim() ) {
			onRename( newName );
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
				} }
			>
				<Stack gap="sm" direction="column">
					<WCInputControl
						autoComplete="off"
						value={ newName }
						onChange={ setNewName }
						label={ __( 'Name' ) }
						placeholder={ placeholder }
					/>
					<Stack justify="end" direction="row">
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
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}
