/**
 * WordPress dependencies
 */
import { Button, TextControl, Modal } from '@wordpress/components';
import { Stack, Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useId } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

export function AllowOverridesModal( {
	placeholder,
	initialName = '',
	onClose,
	onSave,
} ) {
	const [ editedBlockName, setEditedBlockName ] = useState( initialName );
	const descriptionId = useId();

	const isNameValid = !! editedBlockName.trim();

	const handleSubmit = () => {
		if ( editedBlockName !== initialName ) {
			const message = sprintf(
				/* translators: %s: new name/label for the block */
				__( 'Block name changed to: "%s".' ),
				editedBlockName
			);

			// Must be assertive to immediately announce change.
			speak( message, 'assertive' );
		}
		onSave( editedBlockName );

		// Immediate close avoids ability to hit save multiple times.
		onClose();
	};

	return (
		<Modal
			title={ __( 'Enable overrides' ) }
			onRequestClose={ onClose }
			focusOnMount="firstContentElement"
			aria={ { describedby: descriptionId } }
			size="small"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();

					if ( ! isNameValid ) {
						return;
					}

					handleSubmit();
				} }
			>
				<Stack direction="column" gap="xl">
					<Text id={ descriptionId }>
						{ __(
							'Overrides are changes you make to a block within a synced pattern instance. Use overrides to customize a synced pattern instance to suit its new context. Name this block to specify an override.'
						) }
					</Text>
					<TextControl
						__next40pxDefaultSize
						value={ editedBlockName }
						label={ __( 'Name' ) }
						help={ __(
							'For example, if you are creating a recipe pattern, you use "Recipe Title", "Recipe Description", etc.'
						) }
						placeholder={ placeholder }
						onChange={ setEditedBlockName }
					/>
					<Stack justify="end">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							__next40pxDefaultSize
							aria-disabled={ ! isNameValid }
							variant="primary"
							type="submit"
						>
							{ __( 'Enable' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}

export function DisallowOverridesModal( { onClose, onSave } ) {
	const descriptionId = useId();

	return (
		<Modal
			title={ __( 'Disable overrides' ) }
			onRequestClose={ onClose }
			aria={ { describedby: descriptionId } }
			size="small"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					onSave();
					onClose();
				} }
			>
				<Stack direction="column" gap="xl">
					<Text id={ descriptionId }>
						{ __(
							'Are you sure you want to disable overrides? Disabling overrides will revert all applied overrides for this block throughout instances of this pattern.'
						) }
					</Text>
					<Stack gap="sm" justify="end">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Disable' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}
