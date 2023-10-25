/**
 * WordPress dependencies
 */
import {
	createSlotFill,
	MenuGroup,
	MenuItem,
	__experimentalStyleProvider as StyleProvider,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	TextControl,
	Modal,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { pipe, useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import {
	useConvertToGroupButtonProps,
	ConvertToGroupButton,
} from '../convert-to-group-buttons';
import { BlockLockMenuItem, useBlockLock } from '../block-lock';
import { store as blockEditorStore } from '../../store';
import BlockModeToggle from '../block-settings-menu/block-mode-toggle';

import { useBlockDisplayInformation } from '../';

const { Fill, Slot } = createSlotFill( 'BlockSettingsMenuControls' );

const BlockSettingsMenuControlsSlot = ( {
	fillProps,
	clientIds = null,
	__unstableDisplayLocation,
} ) => {
	const { selectedBlocks, selectedClientIds } = useSelect(
		( select ) => {
			const { getBlockNamesByClientId, getSelectedBlockClientIds } =
				select( blockEditorStore );
			const ids =
				clientIds !== null ? clientIds : getSelectedBlockClientIds();
			return {
				selectedBlocks: getBlockNamesByClientId( ids ),
				selectedClientIds: ids,
			};
		},
		[ clientIds ]
	);

	const { canLock } = useBlockLock( selectedClientIds[ 0 ] );
	const { canRename } = useBlockRename( selectedBlocks[ 0 ] );
	const showLockButton = selectedClientIds.length === 1 && canLock;
	const showRenameButton =
		selectedClientIds.length === 1 &&
		// Todo confirm whether following conditional is needed anymore.
		// clientId === selectedClientIds[ 0 ] &&
		canRename;

	// Check if current selection of blocks is Groupable or Ungroupable
	// and pass this props down to ConvertToGroupButton.
	const convertToGroupButtonProps =
		useConvertToGroupButtonProps( selectedClientIds );
	const { isGroupable, isUngroupable } = convertToGroupButtonProps;
	const showConvertToGroupButton = isGroupable || isUngroupable;

	return (
		<Slot
			fillProps={ {
				...fillProps,
				__unstableDisplayLocation,
				selectedBlocks,
				selectedClientIds,
			} }
		>
			{ ( fills ) => {
				if (
					! fills?.length > 0 &&
					! showConvertToGroupButton &&
					! showLockButton
				) {
					return null;
				}

				return (
					<MenuGroup>
						{ showConvertToGroupButton && (
							<ConvertToGroupButton
								{ ...convertToGroupButtonProps }
								onClose={ fillProps?.onClose }
							/>
						) }
						{ showLockButton && (
							<BlockLockMenuItem
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ showRenameButton && (
							<BlockRenameControl
								clientId={ selectedClientIds[ 0 ] }
							/>
						) }
						{ fills }
						{ fillProps?.canMove && ! fillProps?.onlyBlock && (
							<MenuItem
								onClick={ pipe(
									fillProps?.onClose,
									fillProps?.onMoveTo
								) }
							>
								{ __( 'Move to' ) }
							</MenuItem>
						) }
						{ fillProps?.count === 1 && (
							<BlockModeToggle
								clientId={ fillProps?.firstBlockClientId }
								onToggle={ fillProps?.onClose }
							/>
						) }
					</MenuGroup>
				);
			} }
		</Slot>
	);
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-settings-menu-controls/README.md
 *
 * @param {Object} props Fill props.
 * @return {WPElement} Element.
 */
function BlockSettingsMenuControls( { ...props } ) {
	return (
		<StyleProvider document={ document }>
			<Fill { ...props } />
		</StyleProvider>
	);
}

BlockSettingsMenuControls.Slot = BlockSettingsMenuControlsSlot;

export default BlockSettingsMenuControls;

function useBlockRename( name ) {
	const metaDataSupport = getBlockSupport(
		name,
		'__experimentalMetadata',
		false
	);

	const supportsBlockNaming = !! (
		true === metaDataSupport || metaDataSupport?.name
	);

	return {
		canRename: supportsBlockNaming,
	};
}

const emptyString = ( testString ) => testString?.trim()?.length === 0;

function BlockRenameControl( { clientId } ) {
	const [ renamingBlock, setRenamingBlock ] = useState( false );

	const { metadata } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );

			const _metadata = getBlockAttributes( clientId )?.metadata;
			return {
				metadata: _metadata,
			};
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const customName = metadata?.name;

	function onChange( newName ) {
		updateBlockAttributes( [ clientId ], {
			metadata: {
				...( metadata && metadata ), // include existing metadata
				name: newName,
			},
		} );
	}

	const blockInformation = useBlockDisplayInformation( clientId );

	return (
		<>
			<MenuItem
				onClick={ () => {
					setRenamingBlock( true );
				} }
				aria-expanded={ renamingBlock }
				aria-haspopup="dialog"
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ renamingBlock && (
				<RenameModal
					blockName={ customName || '' }
					originalBlockName={ blockInformation?.title }
					onClose={ () => setRenamingBlock( false ) }
					onSave={ ( newName ) => {
						// If the new value is the block's original name (e.g. `Group`)
						// or it is an empty string then assume the intent is to reset
						// the value. Therefore reset the metadata.
						if (
							newName === blockInformation?.title ||
							emptyString( newName )
						) {
							newName = undefined;
						}

						onChange( newName );
					} }
				/>
			) }
		</>
	);
}

function RenameModal( { blockName, originalBlockName, onClose, onSave } ) {
	const [ editedBlockName, setEditedBlockName ] = useState( blockName );

	const nameHasChanged = editedBlockName !== blockName;
	const nameIsOriginal = editedBlockName === originalBlockName;
	const nameIsEmpty = emptyString( editedBlockName );

	const isNameValid = nameHasChanged || nameIsOriginal;

	const autoSelectInputText = ( event ) => event.target.select();

	const dialogDescription = useInstanceId(
		RenameModal,
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
