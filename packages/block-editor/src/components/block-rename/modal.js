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
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useBlockDisplayInformation } from '..';
import isEmptyString from './is-empty-string';

export default function BlockRenameModal( { clientId, onClose } ) {
	const [ editedBlockName, setEditedBlockName ] = useState();

	const blockInformation = useBlockDisplayInformation( clientId );
	const { metadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );

			return {
				metadata: getBlockAttributes( clientId )?.metadata,
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const blockName = metadata?.name || '';
	const originalBlockName = blockInformation?.title;
	// Pattern Overrides is a WordPress-only feature but it also uses the Block Binding API.
	// Ideally this should not be inside the block editor package, but we keep it here for simplicity.
	const hasOverridesWarning =
		!! blockName &&
		!! metadata?.bindings &&
		Object.values( metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		);

	const nameHasChanged =
		editedBlockName !== undefined && editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = isEmptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;

	const autoSelectInputText = ( event ) => event.target.select();

	const handleSubmit = () => {
		const newName =
			nameIsOriginal || nameIsEmpty ? undefined : editedBlockName;
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
		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name: newName,
			},
		} );

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
						value={ editedBlockName ?? blockName }
						label={ __( 'Name' ) }
						help={
							hasOverridesWarning
								? __(
										'This block allows overrides. Changing the name can cause problems with content entered into instances of this pattern.'
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
							accessibleWhenDisabled
							disabled={ ! isNameValid }
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
