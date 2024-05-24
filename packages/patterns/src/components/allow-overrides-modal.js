/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	__experimentalText as Text,
	TextControl,
	Modal,
} from '@wordpress/components';
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
				<VStack spacing="6">
					<Text id={ descriptionId }>
						{ __(
							'Adding an override will allow this block to be edited within any instance of this synced pattern. To set an override, name this block.'
						) }
					</Text>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ editedBlockName }
						label={ __( 'Name' ) }
						help={ __(
							'For example, if you are creating a recipe pattern, you use "Recipe Title", "Recipe Description", etc.'
						) }
						placeholder={ placeholder }
						onChange={ setEditedBlockName }
					/>
					<HStack justify="right">
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
					</HStack>
				</VStack>
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
				<VStack spacing="6">
					<Text id={ descriptionId }>
						{ __(
							'Are you sure you want to disable an override for this block? By disabling, any custom content for this block throughout every instance of this pattern will be reverted to the original content of the synced pattern.'
						) }
					</Text>

					<HStack justify="right">
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
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
