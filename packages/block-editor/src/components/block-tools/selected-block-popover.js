/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockContextualToolbar from './block-contextual-toolbar';
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import Inserter from '../inserter';
import { useShouldContextualToolbarShow } from '../../utils/use-should-contextual-toolbar-show';

function selector( select ) {
	const {
		__unstableGetEditorMode,
		hasMultiSelection,
		isTyping,
		getLastMultiSelectedBlockClientId,
	} = select( blockEditorStore );

	return {
		editorMode: __unstableGetEditorMode(),
		hasMultiSelection: hasMultiSelection(),
		isTyping: isTyping(),
		lastClientId: hasMultiSelection()
			? getLastMultiSelectedBlockClientId()
			: null,
	};
}

function SelectedBlockPopover( {
	clientId,
	rootClientId,
	isEmptyDefaultBlock,
	capturingClientId,
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const { editorMode, hasMultiSelection, isTyping, lastClientId } = useSelect(
		selector,
		[]
	);

	const isInsertionPointVisible = useSelect(
		( select ) => {
			const {
				isBlockInsertionPointVisible,
				getBlockInsertionPoint,
				getBlockOrder,
			} = select( blockEditorStore );

			if ( ! isBlockInsertionPointVisible() ) {
				return false;
			}

			const insertionPoint = getBlockInsertionPoint();
			const order = getBlockOrder( insertionPoint.rootClientId );
			return order[ insertionPoint.index ] === clientId;
		},
		[ clientId ]
	);
	const isToolbarForced = useRef( false );
	const { shouldShowContextualToolbar, canFocusHiddenToolbar } =
		useShouldContextualToolbarShow();

	const { stopTyping } = useDispatch( blockEditorStore );

	const showEmptyBlockSideInserter =
		! isTyping && editorMode === 'edit' && isEmptyDefaultBlock;
	const shouldShowBreadcrumb =
		! hasMultiSelection &&
		( editorMode === 'navigation' || editorMode === 'zoom-out' );

	useShortcut(
		'core/block-editor/focus-toolbar',
		() => {
			isToolbarForced.current = true;
			stopTyping( true );
		},
		{
			isDisabled: ! canFocusHiddenToolbar,
		}
	);

	useEffect( () => {
		isToolbarForced.current = false;
	} );

	// Stores the active toolbar item index so the block toolbar can return focus
	// to it when re-mounting.
	const initialToolbarItemIndexRef = useRef();

	useEffect( () => {
		// Resets the index whenever the active block changes so this is not
		// persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
		initialToolbarItemIndexRef.current = undefined;
	}, [ clientId ] );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	if ( showEmptyBlockSideInserter ) {
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

	if ( shouldShowBreadcrumb || shouldShowContextualToolbar ) {
		return (
			<BlockPopover
				clientId={ capturingClientId || clientId }
				bottomClientId={ lastClientId }
				className={ classnames(
					'block-editor-block-list__block-popover',
					{
						'is-insertion-point-visible': isInsertionPointVisible,
					}
				) }
				__unstablePopoverSlot={ __unstablePopoverSlot }
				__unstableContentRef={ __unstableContentRef }
				resize={ false }
				{ ...popoverProps }
			>
				{ shouldShowContextualToolbar && (
					<BlockContextualToolbar
						// If the toolbar is being shown because of being forced
						// it should focus the toolbar right after the mount.
						focusOnMount={ isToolbarForced.current }
						__experimentalInitialIndex={
							initialToolbarItemIndexRef.current
						}
						__experimentalOnIndexChange={ ( index ) => {
							initialToolbarItemIndexRef.current = index;
						} }
						// Resets the index whenever the active block changes so
						// this is not persisted. See https://github.com/WordPress/gutenberg/pull/25760#issuecomment-717906169
						key={ clientId }
					/>
				) }
				{ shouldShowBreadcrumb && (
					<BlockSelectionButton
						clientId={ clientId }
						rootClientId={ rootClientId }
					/>
				) }
			</BlockPopover>
		);
	}

	return null;
}

function wrapperSelector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getBlockRootClientId,
		getBlock,
		getBlockParents,
		__experimentalGetBlockListSettingsForBlocks,
	} = select( blockEditorStore );

	const clientId =
		getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

	if ( ! clientId ) {
		return;
	}

	const { name, attributes = {} } = getBlock( clientId ) || {};
	const blockParentsClientIds = getBlockParents( clientId );

	// Get Block List Settings for all ancestors of the current Block clientId.
	const parentBlockListSettings = __experimentalGetBlockListSettingsForBlocks(
		blockParentsClientIds
	);

	// Get the clientId of the topmost parent with the capture toolbars setting.
	const capturingClientId = blockParentsClientIds.find(
		( parentClientId ) =>
			parentBlockListSettings[ parentClientId ]
				?.__experimentalCaptureToolbars
	);

	return {
		clientId,
		rootClientId: getBlockRootClientId( clientId ),
		name,
		isEmptyDefaultBlock:
			name && isUnmodifiedDefaultBlock( { name, attributes } ),
		capturingClientId,
	};
}

export default function WrappedBlockPopover( {
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const selected = useSelect( wrapperSelector, [] );

	if ( ! selected ) {
		return null;
	}

	const {
		clientId,
		rootClientId,
		name,
		isEmptyDefaultBlock,
		capturingClientId,
	} = selected;

	if ( ! name ) {
		return null;
	}

	return (
		<SelectedBlockPopover
			clientId={ clientId }
			rootClientId={ rootClientId }
			isEmptyDefaultBlock={ isEmptyDefaultBlock }
			capturingClientId={ capturingClientId }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
		/>
	);
}
