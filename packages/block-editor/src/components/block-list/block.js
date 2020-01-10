/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last, findIndex } from 'lodash';
import { animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useLayoutEffect, useState, useCallback, useContext } from '@wordpress/element';
import {
	focus,
	isTextField,
	placeCaretAtHorizontalEdge,
} from '@wordpress/dom';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import {
	getBlockType,
	getSaveElement,
	isReusableBlock,
	isUnmodifiedDefaultBlock,
	getUnregisteredTypeHandlerName,
	__experimentalGetAccessibleBlockLabel as getAccessibleBlockLabel,
} from '@wordpress/blocks';
import { withFilters, Popover } from '@wordpress/components';
import {
	withDispatch,
	withSelect,
	useSelect,
} from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { compose, pure, ifCondition } from '@wordpress/compose';
import { useShortcut } from '@wordpress/keyboard-shortcuts';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import Inserter from '../inserter';
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from './moving-animation';
import { ChildToolbar, ChildToolbarSlot } from './block-child-toolbar';
import { Context } from './root-container';

/**
 * A debounced version of getAccessibleBlockLabel, avoids unnecessary updates to the aria-label attribute
 * when typing in some blocks, like the paragraph.
 *
 * @param {Object} blockType      The block type object representing the block's definition.
 * @param {Object} attributes     The block's attribute values.
 * @param {number} index          The index of the block in the block list.
 * @param {string} moverDirection A string representing whether the movers are displayed vertically or horizontally.
 * @param {number} delay          The debounce delay.
 */
const useDebouncedAccessibleBlockLabel = ( blockType, attributes, index, moverDirection, delay ) => {
	const [ blockLabel, setBlockLabel ] = useState( '' );

	useEffect( () => {
		const timeoutId = setTimeout( () => {
			setBlockLabel( getAccessibleBlockLabel( blockType, attributes, index + 1, moverDirection ) );
		}, delay );

		return () => {
			clearTimeout( timeoutId );
		};
	}, [ blockType, attributes, index, moverDirection, delay ] );

	return blockLabel;
};

function BlockListBlock( {
	mode,
	isFocusMode,
	hasFixedToolbar,
	moverDirection,
	isLocked,
	clientId,
	rootClientId,
	isSelected,
	isMultiSelected,
	isPartOfMultiSelection,
	isFirstMultiSelected,
	isTypingWithinBlock,
	isCaretWithinFormattedText,
	isEmptyDefaultBlock,
	isAncestorOfSelectedBlock,
	isCapturingDescendantToolbars,
	hasAncestorCapturingToolbars,
	isSelectionEnabled,
	className,
	name,
	index,
	isValid,
	isLast,
	attributes,
	initialPosition,
	wrapperProps,
	setAttributes,
	onReplace,
	onInsertBlocksAfter,
	onMerge,
	onSelect,
	onRemove,
	onInsertDefaultBlockAfter,
	toggleSelection,
	animateOnChange,
	enableAnimation,
	isNavigationMode,
	isMultiSelecting,
	isLargeViewport,
	hasSelectedUI = true,
	hasMovers = true,
} ) {
	const onSelectionStart = useContext( Context );
	// In addition to withSelect, we should favor using useSelect in this component going forward
	// to avoid leaking new props to the public API (editor.BlockListBlock filter)
	const { isDraggingBlocks } = useSelect( ( select ) => {
		return {
			isDraggingBlocks: select( 'core/block-editor' ).isDraggingBlocks(),
		};
	}, [] );

	// Reference of the wrapper
	const wrapper = useRef( null );

	// Reference to the block edit node
	const blockNodeRef = useRef();

	// Handling the error state
	const [ hasError, setErrorState ] = useState( false );
	const onBlockError = () => setErrorState( true );

	const [ isToolbarForced, setIsToolbarForced ] = useState( false );

	const blockType = getBlockType( name );
	const blockAriaLabel = useDebouncedAccessibleBlockLabel( blockType, attributes, index, moverDirection, 400 );

	// Handing the focus of the block on creation and update

	/**
	 * When a block becomes selected, transition focus to an inner tabbable.
	 *
	 * @param {boolean} ignoreInnerBlocks Should not focus inner blocks.
	 */
	const focusTabbable = ( ignoreInnerBlocks ) => {
		// Focus is captured by the wrapper node, so while focus transition
		// should only consider tabbables within editable display, since it
		// may be the wrapper itself or a side control which triggered the
		// focus event, don't unnecessary transition to an inner tabbable.
		if ( wrapper.current.contains( document.activeElement ) ) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable
			.find( blockNodeRef.current )
			.filter( isTextField )
			// Exclude inner blocks
			.filter( ( node ) => ! ignoreInnerBlocks || isInsideRootBlock( blockNodeRef.current, node ) );

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target = ( isReverse ? last : first )( textInputs );

		if ( ! target ) {
			wrapper.current.focus();
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
	}, [ isSelected, isMultiSelecting ] );

	// Focus the first multi selected block
	useEffect( () => {
		if ( isFirstMultiSelected ) {
			wrapper.current.focus();
		}
	}, [ isFirstMultiSelected ] );

	// Block Reordering animation
	const animationStyle = useMovingAnimation( wrapper, isSelected || isPartOfMultiSelection, isSelected || isFirstMultiSelected, enableAnimation, animateOnChange );

	// Focus the first editable or the wrapper if edit mode.
	useLayoutEffect( () => {
		if ( isSelected && ! isNavigationMode ) {
			focusTabbable( true );
		}
	}, [ isSelected, isNavigationMode ] );

	// Other event handlers

	/**
	 * Interprets keydown event intent to remove or insert after block if key
	 * event occurs on wrapper node. This can occur when the block has no text
	 * fields of its own, particularly after initial insertion, to allow for
	 * easy deletion and continuous writing flow to add additional content.
	 *
	 * @param {KeyboardEvent} event Keydown event.
	 */
	const onKeyDown = ( event ) => {
		const { keyCode, target } = event;

		switch ( keyCode ) {
			case ENTER:
				if ( target === wrapper.current ) {
					// Insert default block after current block if enter and event
					// not already handled by descendant.
					onInsertDefaultBlockAfter();
					event.preventDefault();
				}
				break;
			case BACKSPACE:
			case DELETE:
				if ( target === wrapper.current ) {
					// Remove block on backspace.
					onRemove( clientId );
					event.preventDefault();
				}
				break;
		}
	};

	const onMouseLeave = ( { which, buttons } ) => {
		// The primary button must be pressed to initiate selection. Fall back
		// to `which` if the standard `buttons` property is falsy. There are
		// cases where Firefox might always set `buttons` to `0`.
		// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
		// See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which
		if ( ( buttons || which ) === 1 ) {
			onSelectionStart( clientId );
		}
	};

	const selectOnOpen = ( open ) => {
		if ( open && ! isSelected ) {
			onSelect();
		}
	};

	const canFocusHiddenToolbar = (
		! isNavigationMode &&
		! shouldShowContextualToolbar &&
		isSelected &&
		! hasFixedToolbar &&
		! isEmptyDefaultBlock
	);
	useShortcut(
		'core/block-editor/focus-toolbar',
		useCallback( () => setIsToolbarForced( true ), [] ),
		{ bindGlobal: true, eventName: 'keydown', isDisabled: ! canFocusHiddenToolbar }
	);

	const isUnregisteredBlock = name === getUnregisteredTypeHandlerName();

	// If the block is selected and we're typing the block should not appear.
	// Empty paragraph blocks should always show up as unselected.
	const showEmptyBlockSideInserter = ! isNavigationMode && ( isSelected || isLast ) && isEmptyDefaultBlock && isValid;
	const shouldAppearSelected =
		! isFocusMode &&
		! showEmptyBlockSideInserter &&
		isSelected &&
		! isTypingWithinBlock;
	const shouldShowBreadcrumb = isNavigationMode && isSelected;
	const shouldShowContextualToolbar =
		! isNavigationMode &&
		! hasFixedToolbar &&
		isLargeViewport &&
		! showEmptyBlockSideInserter &&
		! isMultiSelecting &&
		(
			( isSelected && ( ! isTypingWithinBlock || isCaretWithinFormattedText ) ) ||
			isFirstMultiSelected
		);

	const isDragging = isDraggingBlocks && ( isSelected || isPartOfMultiSelection );

	// The wp-block className is important for editor styles.
	// Generate the wrapper class names handling the different states of the block.
	const wrapperClassName = classnames(
		'wp-block block-editor-block-list__block',
		{
			'has-selected-ui': hasSelectedUI,
			'has-warning': ! isValid || !! hasError || isUnregisteredBlock,
			'is-selected': shouldAppearSelected && hasSelectedUI,
			'is-navigate-mode': isNavigationMode,
			'is-multi-selected': isMultiSelected,
			'is-reusable': isReusableBlock( blockType ),
			'is-dragging': isDragging,
			'is-typing': isTypingWithinBlock,
			'is-focused': isFocusMode && ( isSelected || isAncestorOfSelectedBlock ),
			'is-focus-mode': isFocusMode,
			'has-child-selected': isAncestorOfSelectedBlock,
			'has-toolbar-captured': hasAncestorCapturingToolbars,
		},
		className
	);

	// Determine whether the block has props to apply to the wrapper.
	if ( blockType.getEditWrapperProps ) {
		wrapperProps = {
			...wrapperProps,
			...blockType.getEditWrapperProps( attributes ),
		};
	}
	const blockElementId = `block-${ clientId }`;

	// We wrap the BlockEdit component in a div that hides it when editing in
	// HTML mode. This allows us to render all of the ancillary pieces
	// (InspectorControls, etc.) which are inside `BlockEdit` but not
	// `BlockHTML`, even in HTML mode.
	let blockEdit = (
		<BlockEdit
			name={ name }
			isSelected={ isSelected }
			attributes={ attributes }
			setAttributes={ setAttributes }
			insertBlocksAfter={ isLocked ? undefined : onInsertBlocksAfter }
			onReplace={ isLocked ? undefined : onReplace }
			mergeBlocks={ isLocked ? undefined : onMerge }
			clientId={ clientId }
			isSelectionEnabled={ isSelectionEnabled }
			toggleSelection={ toggleSelection }
		/>
	);
	if ( mode !== 'visual' ) {
		blockEdit = <div style={ { display: 'none' } }>{ blockEdit }</div>;
	}

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
			data-align={ wrapperProps ? wrapperProps[ 'data-align' ] : undefined }
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
		<animated.div
			id={ blockElementId }
			ref={ wrapper }
			className={ wrapperClassName }
			data-type={ name }
			// Only allow shortcuts when a blocks is selected and not locked.
			onKeyDown={ isSelected && ! isLocked ? onKeyDown : undefined }
			tabIndex="0"
			aria-label={ blockAriaLabel }
			role="group"
			{ ...wrapperProps }
			style={
				wrapperProps && wrapperProps.style ?
					{
						...wrapperProps.style,
						...animationStyle,
					} :
					animationStyle
			}
		>
			{ hasAncestorCapturingToolbars && ( shouldShowContextualToolbar || isToolbarForced ) && (
				// If the parent Block is set to consume toolbars of the child Blocks
				// then render the child Block's toolbar into the Slot provided
				// by the parent.
				<ChildToolbar>
					{ renderBlockContextualToolbar() }
				</ChildToolbar>
			) }
			{ (
				shouldShowBreadcrumb ||
				shouldShowContextualToolbar ||
				isToolbarForced ||
				showEmptyBlockSideInserter ||
				isCapturingDescendantToolbars
			) && (
				<Popover
					noArrow
					animate={ false }
					position={ popoverPosition }
					focusOnMount={ false }
					anchorRef={ blockNodeRef.current }
					className="block-editor-block-list__block-popover"
					__unstableSticky={ showEmptyBlockSideInserter ? false : popoverIsSticky }
					__unstableSlotName="block-toolbar"
					// Allow subpixel positioning for the block movement animation.
					__unstableAllowVerticalSubpixelPosition={ moverDirection !== 'horizontal' && wrapper.current }
					__unstableAllowHorizontalSubpixelPosition={ moverDirection === 'horizontal' && wrapper.current }
					onBlur={ () => setIsToolbarForced( false ) }
				>
					{ ! hasAncestorCapturingToolbars && ( shouldShowContextualToolbar || isToolbarForced ) && renderBlockContextualToolbar() }
					{ ( isCapturingDescendantToolbars ) && (
						// A slot made available on all ancestors of the selected Block
						// to allow child Blocks to render their toolbars into the DOM
						// of the appropriate parent.
						<ChildToolbarSlot />
					) }
					{ shouldShowBreadcrumb && (
						<BlockBreadcrumb
							clientId={ clientId }
							data-align={ wrapperProps ? wrapperProps[ 'data-align' ] : undefined }
						/>
					) }
					{ showEmptyBlockSideInserter && (
						<div className="block-editor-block-list__empty-block-inserter">
							<Inserter
								position="top right"
								onToggle={ selectOnOpen }
								rootClientId={ rootClientId }
								clientId={ clientId }
							/>
						</div>
					) }
				</Popover>
			) }
			<div
				ref={ blockNodeRef }
				// Only allow selection to be started from a selected block.
				onMouseLeave={ isSelected ? onMouseLeave : undefined }
				data-block={ clientId }
			>
				<BlockCrashBoundary onError={ onBlockError }>
					{ isValid && blockEdit }
					{ isValid && mode === 'html' && (
						<BlockHtml clientId={ clientId } />
					) }
					{ ! isValid && [
						<BlockInvalidWarning
							key="invalid-warning"
							clientId={ clientId }
						/>,
						<div key="invalid-preview">
							{ getSaveElement( blockType, attributes ) }
						</div>,
					] }
				</BlockCrashBoundary>
				{ !! hasError && <BlockCrashWarning /> }
			</div>
		</animated.div>
	);
}

const applyWithSelect = withSelect(
	( select, { clientId, rootClientId, isLargeViewport } ) => {
		const {
			isBlockSelected,
			isAncestorMultiSelected,
			isBlockMultiSelected,
			isFirstMultiSelectedBlock,
			isTyping,
			isCaretWithinFormattedText,
			getBlockMode,
			isSelectionEnabled,
			getSelectedBlocksInitialCaretPosition,
			getSettings,
			hasSelectedInnerBlock,
			getTemplateLock,
			getBlockIndex,
			getBlockOrder,
			__unstableGetBlockWithoutInnerBlocks,
			isNavigationMode,
			getBlockListSettings,
			__experimentalGetBlockListSettingsForBlocks,
			getBlockParents,
		} = select( 'core/block-editor' );

		const block = __unstableGetBlockWithoutInnerBlocks( clientId );

		const isSelected = isBlockSelected( clientId );
		const { hasFixedToolbar, focusMode, isRTL } = getSettings();
		const templateLock = getTemplateLock( rootClientId );
		const checkDeep = true;

		// "ancestor" is the more appropriate label due to "deep" check
		const isAncestorOfSelectedBlock = hasSelectedInnerBlock( clientId, checkDeep );
		const index = getBlockIndex( clientId, rootClientId );
		const blockOrder = getBlockOrder( rootClientId );
		const blockParentsClientIds = getBlockParents( clientId );
		const currentBlockListSettings = getBlockListSettings( clientId );

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

		// The fallback to `{}` is a temporary fix.
		// This function should never be called when a block is not present in the state.
		// It happens now because the order in withSelect rendering is not correct.
		const { name, attributes, isValid } = block || {};

		return {
			isMultiSelected: isBlockMultiSelected( clientId ),
			isPartOfMultiSelection:
				isBlockMultiSelected( clientId ) || isAncestorMultiSelected( clientId ),
			isFirstMultiSelected: isFirstMultiSelectedBlock( clientId ),

			// We only care about this prop when the block is selected
			// Thus to avoid unnecessary rerenders we avoid updating the prop if the block is not selected.
			isTypingWithinBlock:
				( isSelected || isAncestorOfSelectedBlock ) && isTyping(),
			isCaretWithinFormattedText: isSelected && isCaretWithinFormattedText(),

			mode: getBlockMode( clientId ),
			isSelectionEnabled: isSelectionEnabled(),
			initialPosition: isSelected ? getSelectedBlocksInitialCaretPosition() : null,
			isEmptyDefaultBlock:
				name && isUnmodifiedDefaultBlock( { name, attributes } ),
			isLocked: !! templateLock,
			isFocusMode: focusMode && isLargeViewport,
			hasFixedToolbar: hasFixedToolbar && isLargeViewport,
			isLast: index === blockOrder.length - 1,
			isNavigationMode: isNavigationMode(),
			index,
			isRTL,

			// Users of the editor.BlockListBlock filter used to be able to access the block prop
			// Ideally these blocks would rely on the clientId prop only.
			// This is kept for backward compatibility reasons.
			block,

			name,
			attributes,
			isValid,
			isSelected,
			isAncestorOfSelectedBlock,
			isCapturingDescendantToolbars,
			hasAncestorCapturingToolbars,
		};
	}
);

const applyWithDispatch = withDispatch( ( dispatch, ownProps, { select } ) => {
	const {
		updateBlockAttributes,
		selectBlock,
		insertBlocks,
		insertDefaultBlock,
		removeBlock,
		mergeBlocks,
		replaceBlocks,
		toggleSelection,
		__unstableMarkLastChangeAsPersistent,
	} = dispatch( 'core/block-editor' );

	return {
		setAttributes( newAttributes ) {
			const { clientId } = ownProps;
			updateBlockAttributes( clientId, newAttributes );
		},
		onSelect( clientId = ownProps.clientId, initialPosition ) {
			selectBlock( clientId, initialPosition );
		},
		onInsertBlocks( blocks, index ) {
			const { rootClientId } = ownProps;
			insertBlocks( blocks, index, rootClientId );
		},
		onInsertDefaultBlockAfter() {
			const { clientId, rootClientId } = ownProps;
			const {
				getBlockIndex,
			} = select( 'core/block-editor' );
			const index = getBlockIndex( clientId, rootClientId );
			insertDefaultBlock( {}, rootClientId, index + 1 );
		},
		onInsertBlocksAfter( blocks ) {
			const { clientId, rootClientId } = ownProps;
			const {
				getBlockIndex,
			} = select( 'core/block-editor' );
			const index = getBlockIndex( clientId, rootClientId );
			insertBlocks( blocks, index + 1, rootClientId );
		},
		onRemove( clientId ) {
			removeBlock( clientId );
		},
		onMerge( forward ) {
			const { clientId } = ownProps;
			const {
				getPreviousBlockClientId,
				getNextBlockClientId,
			} = select( 'core/block-editor' );

			if ( forward ) {
				const nextBlockClientId = getNextBlockClientId( clientId );
				if ( nextBlockClientId ) {
					mergeBlocks( clientId, nextBlockClientId );
				}
			} else {
				const previousBlockClientId = getPreviousBlockClientId( clientId );
				if ( previousBlockClientId ) {
					mergeBlocks( previousBlockClientId, clientId );
				}
			}
		},
		onReplace( blocks, indexToSelect ) {
			if (
				blocks.length &&
				! isUnmodifiedDefaultBlock( blocks[ blocks.length - 1 ] )
			) {
				__unstableMarkLastChangeAsPersistent();
			}
			replaceBlocks( [ ownProps.clientId ], blocks, indexToSelect );
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

export default compose(
	pure,
	withViewportMatch( { isLargeViewport: 'medium' } ),
	applyWithSelect,
	applyWithDispatch,
	// block is sometimes not mounted at the right time, causing it be undefined
	// see issue for more info https://github.com/WordPress/gutenberg/issues/17013
	ifCondition( ( { block } ) => !! block ),
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );
