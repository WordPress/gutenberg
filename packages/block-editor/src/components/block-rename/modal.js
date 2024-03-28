/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
	CheckboxControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
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
	const [ checkedWaring, setCheckedWarning ] = useState( false );

	const nameHasChanged = editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = isEmptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;
	const isSaveDisabled =
		! isNameValid || ( hasOverridesWarning && ! checkedWaring );

	const autoSelectInputText = ( event ) => event.target.select();

	const dialogDescription = useInstanceId(
		BlockRenameModal,
		`block-editor-rename-modal__description`
	);

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
			aria={ {
				describedby: dialogDescription,
			} }
			focusOnMount="firstContentElement"
			size="small"
		>
			<p id={ dialogDescription }>
				{ __( 'Enter a custom name for this block.' ) }
			</p>
			<form
				onSubmit={ ( e ) => {
					e.preventDefault();

					if ( isSaveDisabled ) {
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
						label={ __( 'Block name' ) }
						hideLabelFromVision
						placeholder={ originalBlockName }
						onChange={ setEditedBlockName }
						onFocus={ autoSelectInputText }
					/>
					{ hasOverridesWarning ? (
						<CheckboxControl
							label={ __(
								'I understand renaming a block with overrides enabled could potentially break existing connections.'
							) }
							checked={ checkedWaring }
							onChange={ ( checked ) =>
								setCheckedWarning( checked )
							}
							required
						/>
					) : null }
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
							aria-disabled={ isSaveDisabled }
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
