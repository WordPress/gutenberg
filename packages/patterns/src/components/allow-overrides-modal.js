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
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

export default function AllowOverridesModal( {
	placeholder,
	onClose,
	onSave,
} ) {
	const [ editedBlockName, setEditedBlockName ] = useState( '' );

	const isNameValid = !! editedBlockName.trim();

	const handleSubmit = () => {
		const message = sprintf(
			/* translators: %s: new name/label for the block */
			__( 'Block name changed to: "%s".' ),
			editedBlockName
		);

		// Must be assertive to immediately announce change.
		speak( message, 'assertive' );
		onSave( editedBlockName );

		// Immediate close avoids ability to hit save multiple times.
		onClose();
	};

	return (
		<Modal
			title={ __( 'Allow overrides' ) }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-allow-overrides-modal"
			focusOnMount="firstContentElement"
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
				<VStack spacing="3">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ editedBlockName }
						label={ __( 'Give the block a name' ) }
						help={ __(
							'Naming your block will help people understand its purpose. e.g. recipe title, recipe photo, recipe ingredients, recipe instructions.'
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
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
