/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useId } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import { unlock } from '../lock-unlock';

// This component is largely based on the BlockRenameModal component from the block-editor package.
function BlockRenameModal( { clientId } ) {
	const { metadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );
			return {
				metadata: attributes?.metadata,
			};
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { setRenamingBlock } = unlock( useDispatch( patternsStore ) );
	const blockInformation = useBlockDisplayInformation( clientId );
	const customName = metadata?.name ?? '';
	const hasPatternOverrides =
		!! customName &&
		!! metadata?.bindings &&
		Object.values( metadata.bindings ).some(
			( binding ) => binding.source === 'core/pattern-overrides'
		);

	const [ editedBlockName, setEditedBlockName ] = useState( customName );
	const descriptionId = useId();

	const nameHasChanged = editedBlockName !== customName;
	const nameIsOriginal = editedBlockName === blockInformation?.title;
	const nameIsEmpty = ! editedBlockName?.trim();
	const isNameValid = nameHasChanged || nameIsOriginal;

	const autoSelectInputText = ( event ) => event.target.select();

	const closeModal = () => setRenamingBlock( null );
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

		// If the new value is the block's original name (e.g. `Group`)
		// or it is an empty string then assume the intent is to reset
		// the value. Therefore reset the metadata.
		let newName = editedBlockName;
		if ( newName === blockInformation?.title || ! newName.trim() ) {
			newName = undefined;
		}

		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name: newName,
			},
		} );

		// Immediate close avoids ability to hit save multiple times.
		closeModal();
	};

	return (
		<Modal
			title={ __( 'Rename' ) }
			onRequestClose={ closeModal }
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
				<VStack spacing="3">
					<Text id={ descriptionId }>
						{ __( 'Enter a custom name for this block.' ) }
					</Text>

					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						value={ editedBlockName }
						label={ __( 'Block name' ) }
						hideLabelFromVision
						help={
							hasPatternOverrides
								? __(
										'This block allows overrides. Changing the name can cause problems with content entered into instances of this pattern.'
								  )
								: undefined
						}
						placeholder={ blockInformation?.title }
						onChange={ setEditedBlockName }
						onFocus={ autoSelectInputText }
					/>
					<HStack justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ closeModal }
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

// Split into a different component to minimize the store subscriptions.
export default function RenameBlockModalControl() {
	const { renamingBlockClientId } = useSelect(
		( select ) => ( {
			renamingBlockClientId: unlock(
				select( patternsStore )
			).getRenamingBlockClientId(),
		} ),
		[]
	);
	if ( ! renamingBlockClientId ) return null;

	return <BlockRenameModal clientId={ renamingBlockClientId } />;
}
