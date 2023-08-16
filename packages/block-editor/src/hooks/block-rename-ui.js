/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';
import {
	MenuItem,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import {
	BlockSettingsMenuControls,
	useBlockDisplayInformation,
} from '../components';

const notEmptyString = ( testString ) => testString?.trim()?.length > 0;

function RenameModal( { blockName, onClose, onSave } ) {
	const [ editedBlockName, setEditedBlockName ] = useState( blockName );

	const nameHasChanged = editedBlockName !== blockName;

	const isNameValid = nameHasChanged && notEmptyString( editedBlockName );

	return (
		<Modal title={ __( 'Rename block' ) } onRequestClose={ onClose }>
			<p>{ __( 'Choose a custom name for this block.' ) }</p>
			<form
				className="sidebar-navigation__rename-modal-form"
				onSubmit={ ( e ) => {
					e.preventDefault();

					if ( ! isNameValid ) {
						return;
					}

					onSave( editedBlockName );

					// Immediate close avoids ability to hit save multiple times.
					onClose();
				} }
			>
				<VStack spacing="3">
					<TextControl
						__nextHasNoMarginBottom
						value={ editedBlockName }
						placeholder={ __( 'Block name' ) }
						onChange={ setEditedBlockName }
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

export const withBlockRenameControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const [ renamingBlock, setRenamingBlock ] = useState( false );
		const { updateBlockAttributes } = useDispatch( blockEditorStore );

		const {
			clientId,
			name: blockName,
			attributes: blockAttributes,
		} = props;

		const blockInformation = useBlockDisplayInformation( clientId );

		const metaDataSupport = getBlockSupport(
			blockName,
			'__experimentalMetadata',
			false
		);

		const supportsBlockNaming = !! (
			true === metaDataSupport || metaDataSupport?.name
		);

		return (
			<>
				{ supportsBlockNaming && (
					<BlockSettingsMenuControls>
						{ ( { selectedClientIds, onClose } ) => {
							// Only enabled for single selections.
							const canRename =
								selectedClientIds.length === 1 &&
								clientId === selectedClientIds[ 0 ];

							// This check ensures
							// - the `BlockSettingsMenuControls` fill
							// doesn't render multiple times and also that it renders for
							// the block from which the menu was triggered.
							// - `Rename` only appears in the ListView options.
							// - `Rename` only appears for blocks that support renaming.
							if (
								// __unstableDisplayLocation !== 'list-view' ||
								! canRename
							) {
								return null;
							}

							return (
								<MenuItem
									onClick={ () => {
										setRenamingBlock( true );
										onClose();
									} }
								>
									{ __( 'Rename' ) }
								</MenuItem>
							);
						} }
					</BlockSettingsMenuControls>
				) }

				{ renamingBlock && supportsBlockNaming && (
					<RenameModal
						blockName={
							blockAttributes?.metadata?.name ||
							blockInformation?.title ||
							''
						}
						onClose={ () => setRenamingBlock( false ) }
						onSave={ ( newName ) => {
							updateBlockAttributes( clientId, {
								// Include existing metadata (if present) to avoid overwriting existing.
								metadata: {
									...( blockAttributes?.metadata &&
										blockAttributes?.metadata ),
									name: newName,
								},
							} );
						} }
					/>
				) }

				<BlockEdit key="edit" { ...props } />
			</>
		);
	},
	'withToolbarControls'
);

addFilter(
	'editor.BlockEdit',
	'core/block-rename-ui/with-block-rename-control',
	withBlockRenameControl
);
