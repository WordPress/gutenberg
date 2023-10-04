/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import Inserter from '../inserter';

function EmptyBlockInserter( {
	clientId,
	rootClientId,
	lastClientId,
	isInsertionPointVisible,
	capturingClientId,
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			__unstableCoverTarget
			bottomClientId={ lastClientId }
			className={ classnames(
				'block-editor-block-list__block-side-inserter-popover',
				{
					'is-insertion-point-visible': isInsertionPointVisible,
				}
			) }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
			resize={ false }
			shift={ false }
			{ ...popoverProps }
		>
			<div className="block-editor-block-list__empty-block-inserter">
				<Inserter
					position="bottom right"
					rootClientId={ rootClientId }
					clientId={ clientId }
					__experimentalIsQuick
				/>
			</div>
		</BlockPopover>
	);
}

export default function WrappedEmptyBlockInserter( {
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const selected = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
			getBlockRootClientId,
			getBlock,
			getBlockParents,
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

	if ( ! selected ) {
		return null;
	}

	const {
		clientId,
		rootClientId,
		name,
		capturingClientId,
		isInsertionPointVisible,
		lastClientId,
		showEmptyBlockSideInserter,
	} = selected;

	if ( ! name || ! showEmptyBlockSideInserter ) {
		return null;
	}

	return (
		<EmptyBlockInserter
			clientId={ clientId }
			rootClientId={ rootClientId }
			isInsertionPointVisible={ isInsertionPointVisible }
			capturingClientId={ capturingClientId }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
			lastClientId={ lastClientId }
		/>
	);
}
