/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalUseSlot as useSlot,
	Fill,
	Popover,
} from '@wordpress/components';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import EmptyBlockInserter from './empty-block-inserter';
import SelectedBlockTools from './selected-block-tools';
import usePopoverScroll from '../block-popover/use-popover-scroll';

export default function SelectedBlockPopover( { __unstableContentRef } ) {
	const selected = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
			getBlockRootClientId,
			getBlock,
			getBlockParents,
			getSettings,
			__experimentalGetBlockListSettingsForBlocks,
			isBlockInsertionPointVisible,
			getBlockInsertionPoint,
			getBlockOrder,
			__unstableGetEditorMode, // showEmptyBlockSideInserter start
			hasMultiSelection,
			isTyping,
			getLastMultiSelectedBlockClientId, // showEmptyBlockSideInserter end
		} = select( blockEditorStore );

		const clientId =
			getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

		if ( ! clientId ) {
			return;
		}

		const { name, attributes = {} } = getBlock( clientId ) || {};
		const blockParentsClientIds = getBlockParents( clientId );

		// Get Block List Settings for all ancestors of the current Block clientId.
		const parentBlockListSettings =
			__experimentalGetBlockListSettingsForBlocks(
				blockParentsClientIds
			);

		// Get the clientId of the topmost parent with the capture toolbars setting.
		const capturingClientId = blockParentsClientIds.find(
			( parentClientId ) =>
				parentBlockListSettings[ parentClientId ]
					?.__experimentalCaptureToolbars
		);

		let isInsertionPointVisible = false;

		if ( isBlockInsertionPointVisible() ) {
			const insertionPoint = getBlockInsertionPoint();
			const order = getBlockOrder( insertionPoint.rootClientId );
			isInsertionPointVisible =
				order[ insertionPoint.index ] === clientId;
		}

		const isEmptyDefaultBlock =
			name && isUnmodifiedDefaultBlock( { name, attributes } );
		const editorMode = __unstableGetEditorMode();

		return {
			clientId,
			rootClientId: getBlockRootClientId( clientId ),
			name,
			capturingClientId,
			isFixed: getSettings().hasFixedToolbar,
			isInsertionPointVisible,
			shouldShowBreadcrumb:
				! hasMultiSelection() &&
				( editorMode === 'navigation' || editorMode === 'zoom-out' ),
			showEmptyBlockSideInserter:
				! isTyping() &&
				__unstableGetEditorMode() === 'edit' &&
				isEmptyDefaultBlock,
			lastClientId: hasMultiSelection()
				? getLastMultiSelectedBlockClientId()
				: null,
		};
	}, [] );

	const blockToolbarRef = usePopoverScroll( __unstableContentRef );

	// TODO: Import this from somewhere so it can be used in the post editor and site editor headers consistently.
	const selectedBlockToolsSlotName = '__experimentalSelectedBlockTools';
	const blockToolsSlot = useSlot( selectedBlockToolsSlotName );

	if ( ! selected ) {
		return null;
	}

	const {
		clientId,
		rootClientId,
		name,
		capturingClientId,
		isFixed,
		isInsertionPointVisible,
		lastClientId,
		showEmptyBlockSideInserter,
		shouldShowBreadcrumb,
	} = selected;

	if ( ! name ) {
		return null;
	}

	const selectedBlockTools = (
		<SelectedBlockTools
			clientId={ clientId }
			rootClientId={ rootClientId }
			capturingClientId={ capturingClientId }
			isInsertionPointVisible={ isInsertionPointVisible }
			isFixed={ isFixed }
			lastClientId={ lastClientId }
			showEmptyBlockSideInserter={ showEmptyBlockSideInserter }
			shouldShowBreadcrumb={ shouldShowBreadcrumb }
		/>
	);

	return (
		<>
			{ showEmptyBlockSideInserter && (
				<EmptyBlockInserter
					clientId={ clientId }
					rootClientId={ rootClientId }
					isInsertionPointVisible={ isInsertionPointVisible }
					capturingClientId={ capturingClientId }
					__unstableContentRef={ __unstableContentRef }
					lastClientId={ lastClientId }
				/>
			) }

			{ /* If there is no slot available, such as in the standalone block editor, render within the editor */ }
			{ blockToolsSlot?.ref?.current ? (
				<Fill name="__experimentalSelectedBlockTools">
					{ selectedBlockTools }
					{ /* Used for the inline rich text toolbar. */ }
					<Popover.Slot
						name="block-toolbar"
						ref={ blockToolbarRef }
					/>
				</Fill>
			) : (
				<>
					{ selectedBlockTools }
					{ /* Used for the inline rich text toolbar. */ }
					<Popover.Slot
						name="block-toolbar"
						ref={ blockToolbarRef }
					/>
				</>
			) }
		</>
	);
}
