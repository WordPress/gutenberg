/**
 * External dependencies
 */
import { find } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';

function selector( select ) {
	const {
		isNavigationMode,
		isMultiSelecting,
		hasMultiSelection,
		isTyping,
		getSettings,
		getLastMultiSelectedBlockClientId,
	} = select( blockEditorStore );
	return {
		isNavigationMode: isNavigationMode(),
		isMultiSelecting: isMultiSelecting(),
		isTyping: isTyping(),
		hasFixedToolbar: getSettings().hasFixedToolbar,
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
	const {
		isNavigationMode,
		isMultiSelecting,
		isTyping,
		hasFixedToolbar,
		lastClientId,
	} = useSelect( selector, [] );
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
	const isLargeViewport = useViewportMatch( 'medium' );
	const isToolbarForced = useRef( false );
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const { stopTyping } = useDispatch( blockEditorStore );

	const showEmptyBlockSideInserter =
		! isTyping && ! isNavigationMode && isEmptyDefaultBlock;
	const shouldShowBreadcrumb = isNavigationMode;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! isMultiSelecting &&
		! showEmptyBlockSideInserter &&
		! isTyping;
	const canFocusHiddenToolbar =
		! isNavigationMode &&
		! shouldShowContextualToolbar &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock;

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

	if ( ! shouldShowBreadcrumb && ! shouldShowContextualToolbar ) {
		return null;
	}

	function onFocus() {
		setIsInserterShown( true );
	}

	function onBlur() {
		setIsInserterShown( false );
	}

	return (
		<BlockPopover
			rootClientId={ rootClientId }
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ classnames( 'block-editor-block-list__block-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
			} ) }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
		>
			{ shouldShowContextualToolbar && (
				<div
					onFocus={ onFocus }
					onBlur={ onBlur }
					// While ideally it would be enough to capture the
					// bubbling focus event from the Inserter, due to the
					// characteristics of click focusing of `button`s in
					// Firefox and Safari, it is not reliable.
					//
					// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
					tabIndex={ -1 }
					className={ classnames(
						'block-editor-block-list__block-popover-inserter',
						{
							'is-visible': isInserterShown,
						}
					) }
				>
					<Inserter
						clientId={ clientId }
						rootClientId={ rootClientId }
						__experimentalIsQuick
					/>
				</div>
			) }
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
	const capturingClientId = find(
		blockParentsClientIds,
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
