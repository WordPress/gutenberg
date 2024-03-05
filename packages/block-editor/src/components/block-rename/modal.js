/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
	ToggleControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import isEmptyString from './is-empty-string';
import { store as blockEditorStore } from '../../store';

export default function BlockRenameModal( {
	blockName,
	originalBlockName,
	onClose,
	onSave,
	initialAllowOverrides,
} ) {
	const [ editedBlockName, setEditedBlockName ] = useState( blockName );
	const [ allowOverrides, setAllowOverrides ] = useState(
		initialAllowOverrides
	);
	const { isEditingPattern } = useSelect(
		( select ) => ( {
			isEditingPattern:
				select( blockEditorStore ).getSettings()?.postType ===
				'wp_block',
		} ),
		[]
	);

	const nameHasChanged = editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = isEmptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;
	const isSaveDisabled =
		! isNameValid && allowOverrides === initialAllowOverrides;

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
		onSave(
			editedBlockName,
			isEditingPattern ? allowOverrides : undefined
		);

		// Immediate close avoids ability to hit save multiple times.
		onClose();
	};

	return (
		<Modal
			title={ __( 'Rename' ) }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-rename-modal"
			focusOnMount="firstContentElement"
			size="small"
		>
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
						help={ __(
							'Naming your block will help people understand its purpose.'
						) }
						placeholder={ originalBlockName }
						onChange={ ( newName ) => {
							setEditedBlockName( newName );
							if ( newName === '' ) {
								setAllowOverrides( false );
							}
						} }
						onFocus={ autoSelectInputText }
					/>
					{ isEditingPattern ? (
						<ToggleControl
							label={ __( 'Allow overrides' ) }
							help={ __(
								'Allow overriding this block in instances where this pattern is used.'
							) }
							checked={ allowOverrides }
							onChange={ ( checked ) => {
								if ( ! nameIsEmpty ) {
									setAllowOverrides( checked );
								}
							} }
							disabled={ nameIsEmpty }
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
