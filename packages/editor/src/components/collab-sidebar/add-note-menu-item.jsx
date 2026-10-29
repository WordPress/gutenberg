import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useRegistry, useSelect } from '@wordpress/data';
import { getUnregisteredTypeHandlerName } from '@wordpress/blocks';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { unlock } from '../../lock-unlock';

const { NoteIconSlotFill, BlockOptionsMenuItem, BlockOptionsMenuItemFill } =
	unlock( blockEditorPrivateApis );

function NoteMenuItem( { clientId, onClick, isDistractionFree } ) {
	const { blockName, isValid, shortcut } = useSelect(
		( select ) => {
			const { getBlockName, isBlockValid } = select( blockEditorStore );
			return {
				blockName: getBlockName( clientId ),
				isValid: isBlockValid( clientId ),
				shortcut: select(
					keyboardShortcutsStore
				).getShortcutRepresentation( 'core/editor/new-note' ),
			};
		},
		[ clientId ]
	);

	if ( ! isValid || blockName === getUnregisteredTypeHandlerName() ) {
		return null;
	}

	const isDisabled = isDistractionFree || blockName === 'core/freeform';

	let infoText;

	if ( isDistractionFree ) {
		infoText = __( 'Notes are disabled in distraction free mode.' );
	} else if ( blockName === 'core/freeform' ) {
		infoText = __( 'Convert to blocks to add notes.' );
	}

	return (
		<MenuItem
			onClick={ onClick }
			disabled={ isDisabled }
			info={ infoText }
			shortcut={ shortcut }
		>
			{ __( 'Add note' ) }
		</MenuItem>
	);
}

/**
 * Adds "Add note" to the More submenu of the redesigned block toolbar.
 *
 * @param {Object}                     props                   Component props.
 * @param {(clientId: string) => void} props.onClick           Called with the client ID of the block.
 * @param {boolean}                    props.isDistractionFree Whether distraction free mode is on.
 */
function OptionsMenuAddNoteItem( { onClick, isDistractionFree } ) {
	const registry = useRegistry();
	const shortcut = useSelect(
		( select ) =>
			select( keyboardShortcutsStore ).getShortcutRepresentation(
				'core/editor/new-note'
			),
		[]
	);
	return (
		<BlockOptionsMenuItemFill>
			{ ( { clientIds } ) => {
				if ( clientIds.length !== 1 ) {
					return null;
				}
				const { getBlockName, isBlockValid } =
					registry.select( blockEditorStore );
				const blockName = getBlockName( clientIds[ 0 ] );
				if (
					! isBlockValid( clientIds[ 0 ] ) ||
					blockName === getUnregisteredTypeHandlerName()
				) {
					return null;
				}
				return (
					<BlockOptionsMenuItem
						group="more"
						name="core/editor/add-note"
						label={ __( 'Add note' ) }
						shortcut={ shortcut }
						disabled={
							isDistractionFree || blockName === 'core/freeform'
						}
						onClick={ () => onClick( clientIds[ 0 ] ) }
					/>
				);
			} }
		</BlockOptionsMenuItemFill>
	);
}

export function AddNoteMenuItem( { onClick, isDistractionFree } ) {
	if ( window.__experimentalBlockToolbarRedesign ) {
		return (
			<OptionsMenuAddNoteItem
				onClick={ onClick }
				isDistractionFree={ isDistractionFree }
			/>
		);
	}
	return (
		<NoteIconSlotFill.Fill>
			{ ( { clientId, onClose } ) => (
				<NoteMenuItem
					clientId={ clientId }
					isDistractionFree={ isDistractionFree }
					onClick={ () => {
						onClick( clientId );
						onClose();
					} }
				/>
			) }
		</NoteIconSlotFill.Fill>
	);
}
