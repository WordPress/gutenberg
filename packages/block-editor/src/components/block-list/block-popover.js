/**
 * External dependencies
 */
import { first, last, findIndex } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useLayoutEffect, useState, useCallback } from '@wordpress/element';
import {
	focus,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Popover } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useShortcut } from '@wordpress/keyboard-shortcuts';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { ChildToolbar, ChildToolbarSlot } from './block-child-toolbar';
import { getBlockWrapperNode, isInsideRootBlock } from '../../utils/dom';

function selector( select ) {
	const {
		getSelectedBlockClientId,
		getFirstMultiSelectedBlockClientId,
		isNavigationMode,
		isMultiSelecting,
		__unstableGetBlockWithoutInnerBlocks,
		isTyping,
		isCaretWithinFormattedText,
		getSelectedBlocksInitialCaretPosition,
		getBlockRootClientId,
		isBlockMultiSelected,
		isAncestorMultiSelected,
		hasSelectedInnerBlock,
		getBlockParents,
		getBlockListSettings,
		__experimentalGetBlockListSettingsForBlocks,
		getSettings,
		__unstableGetBlockNode,
	} = select( 'core/block-editor' );

	const clientId = getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();
	const { name, attributes, isValid } = __unstableGetBlockWithoutInnerBlocks( clientId );

	const checkDeep = true;

	// "ancestor" is the more appropriate label due to "deep" check
	const isAncestorOfSelectedBlock = hasSelectedInnerBlock( clientId, checkDeep );
	const blockParentsClientIds = getBlockParents( clientId );
	const currentBlockListSettings = getBlockListSettings( clientId );
	const blockRootClientId = getBlockRootClientId( clientId );

	const {
		__experimentalMoverDirection,
	} = getBlockListSettings( blockRootClientId ) || {};

	// Get Block List Settings for all ancestors of the current Block clientId
	const ancestorBlockListSettings = __experimentalGetBlockListSettingsForBlocks( blockParentsClientIds );

	// Find the index of the first Block with the `captureDescendantsToolbars` prop defined
	// This will be the top most ancestor because getBlockParents() returns tree from top -> bottom
	const topmostAncestorWithCaptureDescendantsToolbarsIndex = findIndex( ancestorBlockListSettings, [ '__experimentalCaptureToolbars', true ] );

	// Boolean to indicate whether current Block has a parent with `captureDescendantsToolbars` set
	const hasAncestorCapturingToolbars = topmostAncestorWithCaptureDescendantsToolbarsIndex !== -1 ? true : false;

	// Is the *current* Block the one capturing all its descendant toolbars?
	// If there is no `topmostAncestorWithCaptureDescendantsToolbarsIndex` then
	// we're at the top of the tree
	const isCapturingDescendantToolbars = isAncestorOfSelectedBlock && ( currentBlockListSettings && currentBlockListSettings.__experimentalCaptureToolbars ) && ! hasAncestorCapturingToolbars;

	const { hasFixedToolbar } = getSettings();

	return {
		name,
		clientId,
		isValid,
		isSelected: !! getSelectedBlockClientId(),
		isFirstMultiSelected: !! getFirstMultiSelectedBlockClientId(),
		isNavigationMode: isNavigationMode(),
		isMultiSelecting: isMultiSelecting(),
		isTyping: isTyping(),
		isCaretWithinFormattedText: isCaretWithinFormattedText(),
		isEmptyDefaultBlock: name && isUnmodifiedDefaultBlock( { name, attributes } ),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		rootClientId: getBlockRootClientId(),
		isPartOfMultiSelection: isBlockMultiSelected( clientId ) || isAncestorMultiSelected( clientId ),
		isCapturingDescendantToolbars,
		hasAncestorCapturingToolbars,
		hasFixedToolbar,
		__experimentalMoverDirection,
		blockNode: __unstableGetBlockNode( clientId ),
	};
}

function BlockPopover() {
	const {
		name,
		clientId,
		isValid,
		isSelected,
		isFirstMultiSelected,
		isNavigationMode,
		isMultiSelecting,
		isTyping,
		isCaretWithinFormattedText,
		isEmptyDefaultBlock,
		initialPosition,
		rootClientId,
		isPartOfMultiSelection,
		isCapturingDescendantToolbars,
		hasAncestorCapturingToolbars,
		hasFixedToolbar,
		__experimentalMoverDirection,
		blockNode,
	} = useSelect( selector, [] );
	const isLargeViewport = useViewportMatch( 'medium' );

	const [ isToolbarForced, setIsToolbarForced ] = useState( false );
	const showEmptyBlockSideInserter = ! isNavigationMode && isEmptyDefaultBlock && isValid;
	const shouldShowBreadcrumb = isNavigationMode;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting &&
		( ! isTyping || isCaretWithinFormattedText );

	const canFocusHiddenToolbar = (
		! isNavigationMode &&
		! shouldShowContextualToolbar &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock
	);

	useShortcut(
		'core/block-editor/focus-toolbar',
		useCallback( () => setIsToolbarForced( true ), [] ),
		{ bindGlobal: true, eventName: 'keydown', isDisabled: ! canFocusHiddenToolbar }
	);

	// Handing the focus of the block on creation and update

	/**
	 * When a block becomes selected, transition focus to an inner tabbable.
	 *
	 * @param {boolean} ignoreInnerBlocks Should not focus inner blocks.
	 */
	const focusTabbable = ( ignoreInnerBlocks ) => {
		const wrapper = getBlockWrapperNode( clientId );

		// Focus is captured by the wrapper node, so while focus transition
		// should only consider tabbables within editable display, since it
		// may be the wrapper itself or a side control which triggered the
		// focus event, don't unnecessary transition to an inner tabbable.
		if ( wrapper.lastChild.contains( document.activeElement ) ) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable
			.find( wrapper )
			.filter( isTextField )
			// Exclude inner blocks
			.filter( ( node ) => ! ignoreInnerBlocks || isInsideRootBlock( wrapper, node ) );

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target = ( isReverse ? last : first )( textInputs );

		if ( ! target ) {
			wrapper.focus();
			return;
		}

		placeCaretAtHorizontalEdge( target, isReverse );
	};

	// Focus the selected block's wrapper or inner input on mount and update
	const isMounting = useRef( true );
	useEffect( () => {
		if ( isSelected && ! isMultiSelecting ) {
			focusTabbable( ! isMounting.current );
		}
		isMounting.current = false;
	}, [ clientId, isSelected, isMultiSelecting ] );

	// Focus the first multi selected block
	useEffect( () => {
		if ( isFirstMultiSelected ) {
			getBlockWrapperNode( clientId ).focus();
		}
	}, [ isFirstMultiSelected ] );

	// Focus the first editable or the wrapper if edit mode.
	useLayoutEffect( () => {
		if ( isSelected && ! isNavigationMode ) {
			focusTabbable( true );
		}
	}, [ isSelected, isNavigationMode ] );

	if ( ! blockNode ) {
		return null;
	}

	if (
		! shouldShowBreadcrumb &&
		! shouldShowContextualToolbar &&
		! isToolbarForced &&
		! showEmptyBlockSideInserter &&
		! isCapturingDescendantToolbars
	) {
		return null;
	}

	const align = blockNode.getAttribute( 'data-align' );
	const hasMovers = true;

	/**
	 * Renders an individual `BlockContextualToolbar` component.
	 * This needs to be a function which generates the component
	 * on demand as we can only have a single toolbar for each render.
	 * This is because of the `isForcingContextualToolbar` logic which
	 * relies on a single toolbar being rendered to update the boolean
	 * value of the ref used to track the "force" state.
	 */
	const renderBlockContextualToolbar = () => (
		<BlockContextualToolbar
			// If the toolbar is being shown because of being forced
			// it should focus the toolbar right after the mount.
			focusOnMount={ isToolbarForced }
			data-type={ name }
			data-align={ align }
			hasMovers={ hasMovers }
		/>
	);

	// Position above the anchor, pop out towards the right, and position in the
	// left corner. For the side inserter, pop out towards the left, and
	// position in the right corner.
	// To do: refactor `Popover` to make this prop clearer.
	const popoverPosition = showEmptyBlockSideInserter ? 'top left right' : 'top right left';
	const popoverIsSticky = isPartOfMultiSelection ? '.wp-block.is-multi-selected' : true;

	return (
		<Popover
			noArrow
			animate={ false }
			position={ popoverPosition }
			focusOnMount={ false }
			anchorRef={ blockNode.lastChild }
			className="block-editor-block-list__block-popover"
			__unstableSticky={ showEmptyBlockSideInserter ? false : popoverIsSticky }
			__unstableSlotName="block-toolbar"
			// Allow subpixel positioning for the block movement animation.
			__unstableAllowVerticalSubpixelPosition={ __experimentalMoverDirection !== 'horizontal' && blockNode }
			__unstableAllowHorizontalSubpixelPosition={ __experimentalMoverDirection === 'horizontal' && blockNode }
			onBlur={ () => setIsToolbarForced( false ) }
		>
			{ ! hasAncestorCapturingToolbars && ( shouldShowContextualToolbar || isToolbarForced ) && renderBlockContextualToolbar() }
			{ ( isCapturingDescendantToolbars ) && (
				// A slot made available on all ancestors of the selected Block
				// to allow child Blocks to render their toolbars into the DOM
				// of the appropriate parent.
				<ChildToolbarSlot />
			) }
			{ hasAncestorCapturingToolbars && ( shouldShowContextualToolbar || isToolbarForced ) && (
				// If the parent Block is set to consume toolbars of the child Blocks
				// then render the child Block's toolbar into the Slot provided
				// by the parent.
				<ChildToolbar>
					{ renderBlockContextualToolbar() }
				</ChildToolbar>
			) }
			{ shouldShowBreadcrumb && (
				<BlockBreadcrumb
					clientId={ clientId }
					data-align={ align }
				/>
			) }
			{ showEmptyBlockSideInserter && (
				<div className="block-editor-block-list__empty-block-inserter">
					<Inserter
						position="top right"
						rootClientId={ rootClientId }
						clientId={ clientId }
					/>
				</div>
			) }
		</Popover>
	);
}

export default function WrappedBlockPopover() {
	const clientId = useSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
		} = select( 'core/block-editor' );

		return getSelectedBlockClientId() || getFirstMultiSelectedBlockClientId();
	}, [] );

	if ( ! clientId ) {
		return null;
	}

	return <BlockPopover />;
}
