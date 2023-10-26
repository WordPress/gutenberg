/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';

const emptyString = ( testString ) => testString?.trim()?.length === 0;

export default function BlockRenameModal( { clientId, onClose } ) {
	const blockInformation = useBlockDisplayInformation( clientId );
	const originalBlockName = blockInformation?.title;

	const metadata = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientId )?.metadata;
		},
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const blockName = metadata?.name || '';
	const [ editedBlockName, setEditedBlockName ] = useState( blockName );

	const nameHasChanged = editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = emptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;

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

		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name:
					// If the new value is the block's original name (e.g. `Group`)
					// or it is an empty string then assume the intent is to reset
					// the value. Therefore reset the metadata.
					editedBlockName === blockInformation?.title ||
					emptyString( editedBlockName )
						? undefined
						: editedBlockName,
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
			aria={ {
				describedby: dialogDescription,
			} }
			focusOnMount="firstContentElement"
		>
			<p id={ dialogDescription }>
				{ __( 'Enter a custom name for this block.' ) }
			</p>
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
						value={ editedBlockName }
						label={ __( 'Block name' ) }
						hideLabelFromVision={ true }
						placeholder={ originalBlockName }
						onChange={ setEditedBlockName }
						onFocus={ autoSelectInputText }
					/>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel' ) }
						</Button>

						<Button
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
