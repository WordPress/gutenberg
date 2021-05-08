/**
 * External dependencies
 */
import { find } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef, useEffect } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Popover } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { usePopoverScroll } from './use-popover-scroll';

function selector( select ) {
	const {
		isNavigationMode,
		isMultiSelecting,
		hasMultiSelection,
		isTyping,
		isCaretWithinFormattedText,
		getSettings,
		getLastMultiSelectedBlockClientId,
	} = select( blockEditorStore );
	return {
		isNavigationMode: isNavigationMode(),
		isMultiSelecting: isMultiSelecting(),
		isTyping: isTyping(),
		isCaretWithinFormattedText: isCaretWithinFormattedText(),
		hasMultiSelection: hasMultiSelection(),
		hasFixedToolbar: getSettings().hasFixedToolbar,
		lastClientId: getLastMultiSelectedBlockClientId(),
	};
}

function BlockPopover( {
	clientId,
	rootClientId,
	isValid,
	isEmptyDefaultBlock,
	capturingClientId,
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const {
		isNavigationMode,
		isMultiSelecting,
		isTyping,
		isCaretWithinFormattedText,
		hasMultiSelection,
		hasFixedToolbar,
		lastClientId,
	} = useSelect( selector, [] );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ isToolbarForced, setIsToolbarForced ] = useState( false );
	const [ isInserterShown, setIsInserterShown ] = useState( false );
	const { stopTyping } = useDispatch( blockEditorStore );

	// Controls when the side inserter on empty lines should
	// be shown, including writing and selection modes.
	const showEmptyBlockSideInserter =
		! isTyping && ! isNavigationMode && isEmptyDefaultBlock && isValid;
	const shouldShowBreadcrumb = isNavigationMode;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting &&
		( ! isTyping || isCaretWithinFormattedText );
	const canFocusHiddenToolbar =
		! isNavigationMode &&
		! shouldShowContextualToolbar &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock;

	useShortcut(
		'core/block-editor/focus-toolbar',
		useCallback( () => {
			setIsToolbarForced( true );
			stopTyping( true );
		}, [] ),
		{
			bindGlobal: true,
			eventName: 'keydown',
			isDisabled: ! canFocusHiddenToolbar,
		}
	);

	useEffect( () => {
		if ( ! shouldShowContextualToolbar ) {
			setIsToolbarForced( false );
		}
	}, [ shouldShowContextualToolbar ] );

	// Stores the active toolbar item index so the block toolbar can return focus
	// to it when re-mounting.
	const initialToolbarItemIndexRef = useRef();

	const selectedElement = useBlockElement( clientId );
	const lastSelectedElement = useBlockElement( lastClientId );
	const capturingElement = useBlockElement( capturingClientId );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	if (
		! shouldShowBreadcrumb &&
		! shouldShowContextualToolbar &&
		! isToolbarForced &&
		! showEmptyBlockSideInserter
	) {
		return null;
	}

	let node = selectedElement;

	if ( ! node ) {
		return null;
	}

	if ( capturingClientId ) {
		node = capturingElement;
	}

	let anchorRef = node;

	if ( hasMultiSelection ) {
		// Wait to render the popover until the bottom reference is available
		// as well.
		if ( ! lastSelectedElement ) {
			return null;
		}

		anchorRef = {
			top: node,
			bottom: lastSelectedElement,
		};
	}

	function onFocus() {
		setIsInserterShown( true );
	}

	function onBlur() {
		setIsInserterShown( false );
	}

	// Position above the anchor, pop out towards the right, and position in the
	// left corner. For the side inserter, pop out towards the left, and
	// position in the right corner.
	// To do: refactor `Popover` to make this prop clearer.
	const popoverPosition = showEmptyBlockSideInserter
		? 'top left right'
		: 'top right left';
	const { ownerDocument } = node;
	const stickyBoundaryElement = showEmptyBlockSideInserter
		? undefined
		: // The sticky boundary element should be the boundary at which the
		  // the block toolbar becomes sticky when the block scolls out of view.
		  // In case of an iframe, this should be the iframe boundary, otherwise
		  // the scroll container.
		  ownerDocument.defaultView.frameElement ||
		  getScrollContainer( node ) ||
		  ownerDocument.body;

	return (
		<Popover
			ref={ popoverScrollRef }
			noArrow
			animate={ false }
			position={ popoverPosition }
			focusOnMount={ false }
			anchorRef={ anchorRef }
			className="block-editor-block-list__block-popover"
			__unstableStickyBoundaryElement={ stickyBoundaryElement }
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			__unstableBoundaryParent
			// Observe movement for block animations (especially horizontal).
			__unstableObserveElement={ node }
			shouldAnchorIncludePadding
		>
			{ ( shouldShowContextualToolbar || isToolbarForced ) && (
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
			{ ( shouldShowContextualToolbar || isToolbarForced ) && (
				<BlockContextualToolbar
					// If the toolbar is being shown because of being forced
					// it should focus the toolbar right after the mount.
					focusOnMount={ isToolbarForced }
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
					blockElement={ node }
				/>
			) }
			{ showEmptyBlockSideInserter && (
				<div className="block-editor-block-list__empty-block-inserter">
					<Inserter
						position="bottom right"
						rootClientId={ rootClientId }
						clientId={ clientId }
						__experimentalIsQuick
					/>
				</div>
			) }
		</Popover>
	);
}

function wrapperSelector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		getBlockRootClientId,
		__unstableGetBlockWithoutInnerBlocks,
		getBlockParents,
		__experimentalGetBlockListSettingsForBlocks,
	} = select( blockEditorStore );

	const clientId =
		getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();

	if ( ! clientId ) {
		return;
	}

	const { name, attributes = {}, isValid } =
		__unstableGetBlockWithoutInnerBlocks( clientId ) || {};
	const blockParentsClientIds = getBlockParents( clientId );

	// Get Block List Settings for all ancestors of the current Block clientId
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
		isValid,
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
		isValid,
		isEmptyDefaultBlock,
		capturingClientId,
	} = selected;

	if ( ! name ) {
		return null;
	}

	return (
		<BlockPopover
			clientId={ clientId }
			rootClientId={ rootClientId }
			isValid={ isValid }
			isEmptyDefaultBlock={ isEmptyDefaultBlock }
			capturingClientId={ capturingClientId }
			__unstablePopoverSlot={ __unstablePopoverSlot }
			__unstableContentRef={ __unstableContentRef }
		/>
	);
}
