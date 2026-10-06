import { Button, Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, ValidatedInputControl } from '@wordpress/ui';

const MAX_PASSWORD_LENGTH = 255;

export default function PostPasswordModal( {
	initialPassword = '',
	onSave,
	onRemove,
	onClose,
} ) {
	const [ draft, setDraft ] = useState( initialPassword ?? '' );

	const customValidity = ( () => {
		if ( ! draft || ! draft.trim() ) {
			return {
				type: 'invalid',
				message: __( 'Enter a password.' ),
			};
		}
		if ( draft.length > MAX_PASSWORD_LENGTH ) {
			return {
				type: 'invalid',
				message: sprintf(
					/* translators: %d: Maximum character count. */
					__( "Password can't exceed %d characters." ),
					MAX_PASSWORD_LENGTH
				),
			};
		}
		return undefined;
	} )();

	const handleSubmit = ( event ) => {
		event.preventDefault();
		if ( ! draft || ! draft.trim() || draft.length > MAX_PASSWORD_LENGTH ) {
			return;
		}
		onSave( draft );
	};

	return (
		<Modal
			title={
				initialPassword ? __( 'Edit password' ) : __( 'Set password' )
			}
			onRequestClose={ onClose }
			size="small"
			focusOnMount="firstContentElement"
		>
			<form onSubmit={ handleSubmit }>
				<Stack direction="column" gap="lg">
					<ValidatedInputControl
						label={ __( 'Password' ) }
						placeholder={ __( 'Use a secure password' ) }
						type="text"
						value={ draft }
						onValueChange={ ( value ) => setDraft( value ?? '' ) }
						customValidity={ customValidity }
					/>
					<Stack
						direction="row"
						justify={
							initialPassword ? 'space-between' : 'flex-end'
						}
						align="center"
					>
						{ !! initialPassword && (
							<Button
								__next40pxDefaultSize
								variant="link"
								isDestructive
								onClick={ onRemove }
							>
								{ __( 'Remove password' ) }
							</Button>
						) }
						<Stack direction="row" gap="sm" justify="flex-end">
							<Button
								__next40pxDefaultSize
								variant="secondary"
								onClick={ onClose }
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								__next40pxDefaultSize
								variant="primary"
								type="submit"
							>
								{ __( 'Save password' ) }
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}
