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
import { useState, useId } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import isEmptyString from './is-empty-string';

export default function BlockRenameModal( {
	blockName,
	originalBlockName,
	onClose,
	onSave,
	hasOverridesWarning,
} ) {
	const [ editedBlockName, setEditedBlockName ] = useState( blockName );
	const descriptionId = useId();

	const nameHasChanged = editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = isEmptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;

	const autoSelectInputText = ( event ) => event.target.select();

	const handleSubmit = () => {
		const message =
			nameIsOriginal || nameIsEmpty
				? sprintf(
						/* translators: %s: new name/label for the block */
						__( 'Block name reset to: "%s".' ),
						editedBlockName
				  )
				: sprintf(
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
			title={ __( 'Rename' ) }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-rename-modal"
			focusOnMount="firstContentElement"
			aria={ { describedby: descriptionId } }
			size="small"
		>
			<form
				onSubmit={ ( e ) => {
					e.preventDefault();

					if ( ! isNameValid ) {
						return;
					}

					handleSubmit();
				} }
			>
				<p id={ descriptionId }>
					{ __( 'Enter a custom name for this block.' ) }
				</p>
				<VStack spacing="3">
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ editedBlockName }
						label={ __( 'Block name' ) }
						hideLabelFromVision
						help={
							hasOverridesWarning
								? __(
										'This block allows overrides. Note that renaming could potentially break existing connections.'
								  )
								: undefined
						}
						placeholder={ originalBlockName }
						onChange={ setEditedBlockName }
						onFocus={ autoSelectInputText }
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
							isDestructive={ hasOverridesWarning }
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
