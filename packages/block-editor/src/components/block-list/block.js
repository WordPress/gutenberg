/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last } from 'lodash';
import { animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
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
} from '@wordpress/blocks';
import { KeyboardShortcuts, withFilters } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import {
	withDispatch,
	withSelect,
} from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { compose, pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockMover from '../block-mover';
import BlockDropZone from '../block-drop-zone';
import BlockInvalidWarning from './block-invalid-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import BlockMultiControls from './multi-controls';
import BlockMobileToolbar from './block-mobile-toolbar';
import BlockInsertionPoint from './insertion-point';
import IgnoreNestedEvents from '../ignore-nested-events';
import InserterWithShortcuts from '../inserter-with-shortcuts';
import Inserter from '../inserter';
import useHoveredArea from './hover-area';
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from './moving-animation';

/**
 * Prevents default dragging behavior within a block to allow for multi-
 * selection to take effect unhampered.
 *
 * @param {DragEvent} event Drag event.
 */
const preventDrag = ( event ) => {
	event.preventDefault();
};

function BlockListBlock( {
	blockRef,
	mode,
	isFocusMode,
	hasFixedToolbar,
	isLocked,
	clientId,
	rootClientId,
	isSelected,
	isPartOfMultiSelection,
	isFirstMultiSelected,
	isTypingWithinBlock,
	isCaretWithinFormattedText,
	isEmptyDefaultBlock,
	isMovable,
	isParentOfSelectedBlock,
	isDraggable,
	isSelectionEnabled,
	isRTL,
	className,
	name,
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
	onShiftSelection,
	onSelectionStart,
	animateOnChange,
	enableAnimation,
} ) {
	// Random state used to rerender the component if needed, ideally we don't need this
	const [ , updateRerenderState ] = useState( {} );
	const rerender = () => updateRerenderState( {} );

	// Reference of the wrapper
	const wrapper = useRef( null );
	useEffect( () => {
		blockRef( wrapper.current, clientId );
	}, [] );

	// Reference to the block edit node
	const blockNodeRef = useRef();

	// Hovered area of the block
	const hoverArea = useHoveredArea( wrapper );

	// Keep track of touchstart to disable hover on iOS
	const hadTouchStart = useRef( false );
	const onTouchStart = () => {
		hadTouchStart.current = true;
	};
	const onTouchStop = () => {
		// Clear touchstart detection
		// Browser will try to emulate mouse events also see https://www.html5rocks.com/en/mobile/touchandmouse/
		hadTouchStart.current = false;
	};

	// Handling isHovered
	const [ isBlockHovered, setBlockHoveredState ] = useState( false );

	/**
	 * Sets the block state as unhovered if currently hovering. There are cases
	 * where mouseleave may occur but the block is not hovered (multi-select),
	 * so to avoid unnecesary renders, the state is only set if hovered.
	 */
	const hideHoverEffects = () => {
		if ( isBlockHovered ) {
			setBlockHoveredState( false );
		}
	};
	/**
	 * A mouseover event handler to apply hover effect when a pointer device is
	 * placed within the bounds of the block. The mouseover event is preferred
	 * over mouseenter because it may be the case that a previous mouseenter
	 * event was blocked from being handled by a IgnoreNestedEvents component,
	 * therefore transitioning out of a nested block to the bounds of the block
	 * would otherwise not trigger a hover effect.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Events/mouseenter
	 */
	const maybeHover = () => {
		if (
			isBlockHovered ||
			isPartOfMultiSelection ||
			isSelected ||
			hadTouchStart.current
		) {
			return;
		}
		setBlockHoveredState( true );
	};

	// Set hover to false once we start typing or select the block.
	useEffect( () => {
		if ( isTypingWithinBlock || isSelected ) {
			hideHoverEffects();
		}
	} );

	// Handling the dragging state
	const [ isDragging, setBlockDraggingState ] = useState( false );
	const onDragStart = () => {
		setBlockDraggingState( true );
	};
	const onDragEnd = () => {
		setBlockDraggingState( false );
	};

	// Handling the error state
	const [ hasError, setErrorState ] = useState( false );
	const onBlockError = () => setErrorState( false );

	// Handling of forceContextualToolbarFocus
	const isForcingContextualToolbar = useRef( false );
	useEffect( () => {
		if ( isForcingContextualToolbar.current ) {
			// The forcing of contextual toolbar should only be true during one update,
			// after the first update normal conditions should apply.
			isForcingContextualToolbar.current = false;
		}
	} );
	const forceFocusedContextualToolbar = () => {
		isForcingContextualToolbar.current = true;
		// trigger a re-render
		rerender();
	};

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
		if ( isSelected ) {
			focusTabbable( ! isMounting.current );
		}
		isMounting.current = false;
	}, [ isSelected ] );

	// Focus the first multi selected block
	useEffect( () => {
		if ( isFirstMultiSelected ) {
			wrapper.current.focus();
		}
	}, [ isFirstMultiSelected ] );

	// Block Reordering animation
	const animationStyle = useMovingAnimation( wrapper, isSelected || isPartOfMultiSelection, enableAnimation, animateOnChange );

	// Other event handlers

	/**
	 * Marks the block as selected when focused and not already selected. This
	 * specifically handles the case where block does not set focus on its own
	 * (via `setFocus`), typically if there is no focusable input in the block.
	 */
	const onFocus = () => {
		if ( ! isSelected && ! isPartOfMultiSelection ) {
			onSelect();
		}
	};

	/**
	 * Interprets keydown event intent to remove or insert after block if key
	 * event occurs on wrapper node. This can occur when the block has no text
	 * fields of its own, particularly after initial insertion, to allow for
	 * easy deletion and continuous writing flow to add additional content.
	 *
	 * @param {KeyboardEvent} event Keydown event.
	 */
	const deleteOrInsertAfterWrapper = ( event ) => {
		const { keyCode, target } = event;

		// These block shortcuts should only trigger if the wrapper of the block is selected
		// And when it's not a multi-selection to avoid conflicting with RichText/Inputs and multiselection.
		if (
			! isSelected ||
			target !== wrapper.current ||
			isLocked
		) {
			return;
		}

		switch ( keyCode ) {
			case ENTER:
				// Insert default block after current block if enter and event
				// not already handled by descendant.
				onInsertDefaultBlockAfter();
				event.preventDefault();
				break;

			case BACKSPACE:
			case DELETE:
				// Remove block on backspace.
				onRemove( clientId );
				event.preventDefault();
				break;
		}
	};

	/**
	 * Begins tracking cursor multi-selection when clicking down within block.
	 *
	 * @param {MouseEvent} event A mousedown event.
	 */
	const onPointerDown = ( event ) => {
		// Not the main button.
		// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
		if ( event.button !== 0 ) {
			return;
		}

		if ( event.shiftKey ) {
			if ( ! isSelected ) {
				onShiftSelection();
				event.preventDefault();
			}

		// Avoid triggering multi-selection if we click toolbars/inspectors
		// and all elements that are outside the Block Edit DOM tree.
		} else if ( blockNodeRef.current.contains( event.target ) ) {
			onSelectionStart( clientId );

			// Allow user to escape out of a multi-selection to a singular
			// selection of a block via click. This is handled here since
			// onFocus excludes blocks involved in a multiselection, as
			// focus can be incurred by starting a multiselection (focus
			// moved to first block's multi-controls).
			if ( isPartOfMultiSelection ) {
				onSelect();
			}
		}
	};

	const selectOnOpen = ( open ) => {
		if ( open && ! isSelected ) {
			onSelect();
		}
	};

	// Rendering the output
	const isHovered = isBlockHovered && ! isPartOfMultiSelection;
	const blockType = getBlockType( name );
	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockType.title );
	// The block as rendered in the editor is composed of general block UI
	// (mover, toolbar, wrapper) and the display of the block content.

	const isUnregisteredBlock = name === getUnregisteredTypeHandlerName();

	// If the block is selected and we're typing the block should not appear.
	// Empty paragraph blocks should always show up as unselected.
	const showInserterShortcuts = ( isSelected || isHovered ) && isEmptyDefaultBlock && isValid;
	const showEmptyBlockSideInserter = ( isSelected || isHovered || isLast ) && isEmptyDefaultBlock && isValid;
	const shouldAppearSelected =
		! isFocusMode &&
		! showEmptyBlockSideInserter &&
		isSelected &&
		! isTypingWithinBlock;
	const shouldAppearHovered =
		! isFocusMode &&
		! hasFixedToolbar &&
		isHovered &&
		! isEmptyDefaultBlock;
	// We render block movers and block settings to keep them tabbale even if hidden
	const shouldRenderMovers =
		( isSelected || hoverArea === ( isRTL ? 'right' : 'left' ) ) &&
		! showEmptyBlockSideInserter &&
		! isPartOfMultiSelection &&
		! isTypingWithinBlock;
	const shouldShowBreadcrumb =
		! isFocusMode && isHovered && ! isEmptyDefaultBlock;
	const shouldShowContextualToolbar =
		! hasFixedToolbar &&
		! showEmptyBlockSideInserter &&
		(
			( isSelected && ( ! isTypingWithinBlock || isCaretWithinFormattedText ) ) ||
			isFirstMultiSelected
		);
	const shouldShowMobileToolbar = shouldAppearSelected;

	// Insertion point can only be made visible if the block is at the
	// the extent of a multi-selection, or not in a multi-selection.
	const shouldShowInsertionPoint =
		( isPartOfMultiSelection && isFirstMultiSelected ) ||
		! isPartOfMultiSelection;

	// The wp-block className is important for editor styles.
	// Generate the wrapper class names handling the different states of the block.
	const wrapperClassName = classnames(
		'wp-block editor-block-list__block block-editor-block-list__block',
		{
			'has-warning': ! isValid || !! hasError || isUnregisteredBlock,
			'is-selected': shouldAppearSelected,
			'is-multi-selected': isPartOfMultiSelection,
			'is-hovered': shouldAppearHovered,
			'is-reusable': isReusableBlock( blockType ),
			'is-dragging': isDragging,
			'is-typing': isTypingWithinBlock,
			'is-focused': isFocusMode && ( isSelected || isParentOfSelectedBlock ),
			'is-focus-mode': isFocusMode,
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

	// Disable reasons:
	//
	//  jsx-a11y/mouse-events-have-key-events:
	//   - onMouseOver is explicitly handling hover effects
	//
	//  jsx-a11y/no-static-element-interactions:
	//   - Each block can be selected by clicking on it

	/* eslint-disable jsx-a11y/mouse-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */

	return (
		<IgnoreNestedEvents
			id={ blockElementId }
			ref={ wrapper }
			onMouseOver={ maybeHover }
			onMouseOverHandled={ hideHoverEffects }
			onMouseLeave={ hideHoverEffects }
			className={ wrapperClassName }
			data-type={ name }
			onTouchStart={ onTouchStart }
			onFocus={ onFocus }
			onClick={ onTouchStop }
			onKeyDown={ deleteOrInsertAfterWrapper }
			tabIndex="0"
			aria-label={ blockLabel }
			childHandledEvents={ [ 'onDragStart', 'onMouseDown' ] }
			tagName={ animated.div }
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
			{ shouldShowInsertionPoint && (
				<BlockInsertionPoint
					clientId={ clientId }
					rootClientId={ rootClientId }
				/>
			) }
			<BlockDropZone
				clientId={ clientId }
				rootClientId={ rootClientId }
			/>
			{ isFirstMultiSelected && (
				<BlockMultiControls rootClientId={ rootClientId } />
			) }
			<div className="editor-block-list__block-edit block-editor-block-list__block-edit">
				{ shouldRenderMovers && (
					<BlockMover
						clientIds={ clientId }
						blockElementId={ blockElementId }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== ( isRTL ? 'right' : 'left' ) }
						isDraggable={
							isDraggable !== false &&
							( ! isPartOfMultiSelection && isMovable )
						}
						onDragStart={ onDragStart }
						onDragEnd={ onDragEnd }
					/>
				) }
				{ shouldShowBreadcrumb && (
					<BlockBreadcrumb
						clientId={ clientId }
						isHidden={
							! ( isHovered || isSelected ) || hoverArea !== ( isRTL ? 'right' : 'left' )
						}
					/>
				) }
				{ ( shouldShowContextualToolbar || isForcingContextualToolbar.current ) && (
					<BlockContextualToolbar
						// If the toolbar is being shown because of being forced
						// it should focus the toolbar right after the mount.
						focusOnMount={ isForcingContextualToolbar.current }
					/>
				) }
				{
					! shouldShowContextualToolbar &&
					isSelected &&
					! hasFixedToolbar &&
					! isEmptyDefaultBlock && (
						<KeyboardShortcuts
							bindGlobal
							eventName="keydown"
							shortcuts={ {
								'alt+f10': forceFocusedContextualToolbar,
							} }
						/>
					)
				}
				<IgnoreNestedEvents
					ref={ blockNodeRef }
					onDragStart={ preventDrag }
					onMouseDown={ onPointerDown }
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
					{ shouldShowMobileToolbar && (
						<BlockMobileToolbar clientId={ clientId } />
					) }
					{ !! hasError && <BlockCrashWarning /> }
				</IgnoreNestedEvents>
			</div>
			{ showInserterShortcuts && (
				<div className="editor-block-list__side-inserter block-editor-block-list__side-inserter">
					<InserterWithShortcuts
						clientId={ clientId }
						rootClientId={ rootClientId }
						onToggle={ selectOnOpen }
					/>
				</div>
			) }
			{ showEmptyBlockSideInserter && (
				<div className="editor-block-list__empty-block-inserter block-editor-block-list__empty-block-inserter">
					<Inserter
						position="top right"
						onToggle={ selectOnOpen }
						rootClientId={ rootClientId }
						clientId={ clientId }
					/>
				</div>
			) }
		</IgnoreNestedEvents>
	);
	/* eslint-enable jsx-a11y/mouse-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
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
		} = select( 'core/block-editor' );
		const block = __unstableGetBlockWithoutInnerBlocks( clientId );
		const isSelected = isBlockSelected( clientId );
		const { hasFixedToolbar, focusMode, isRTL } = getSettings();
		const templateLock = getTemplateLock( rootClientId );
		const isParentOfSelectedBlock = hasSelectedInnerBlock( clientId, true );
		const index = getBlockIndex( clientId, rootClientId );
		const blockOrder = getBlockOrder( rootClientId );

		// The fallback to `{}` is a temporary fix.
		// This function should never be called when a block is not present in the state.
		// It happens now because the order in withSelect rendering is not correct.
		const { name, attributes, isValid } = block || {};

		return {
			isPartOfMultiSelection:
				isBlockMultiSelected( clientId ) || isAncestorMultiSelected( clientId ),
			isFirstMultiSelected: isFirstMultiSelectedBlock( clientId ),
			// We only care about this prop when the block is selected
			// Thus to avoid unnecessary rerenders we avoid updating the prop if the block is not selected.
			isTypingWithinBlock:
				( isSelected || isParentOfSelectedBlock ) && isTyping(),
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			mode: getBlockMode( clientId ),
			isSelectionEnabled: isSelectionEnabled(),
			initialPosition: isSelected ? getSelectedBlocksInitialCaretPosition() : null,
			isEmptyDefaultBlock:
				name && isUnmodifiedDefaultBlock( { name, attributes } ),
			isMovable: 'all' !== templateLock,
			isLocked: !! templateLock,
			isFocusMode: focusMode && isLargeViewport,
			hasFixedToolbar: hasFixedToolbar && isLargeViewport,
			isLast: index === blockOrder.length - 1,
			isRTL,

			// Users of the editor.BlockListBlock filter used to be able to access the block prop
			// Ideally these blocks would rely on the clientId prop only.
			// This is kept for backward compatibility reasons.
			block,

			name,
			attributes,
			isValid,
			isSelected,
			isParentOfSelectedBlock,
		};
	}
);

const applyWithDispatch = withDispatch( ( dispatch, ownProps, { select } ) => {
	const {
		updateBlockAttributes,
		selectBlock,
		multiSelect,
		insertBlocks,
		insertDefaultBlock,
		removeBlock,
		mergeBlocks,
		replaceBlocks,
		toggleSelection,
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
			replaceBlocks( [ ownProps.clientId ], blocks, indexToSelect );
		},
		onShiftSelection() {
			if ( ! ownProps.isSelectionEnabled ) {
				return;
			}

			const {
				getBlockSelectionStart,
			} = select( 'core/block-editor' );

			if ( getBlockSelectionStart() ) {
				multiSelect( getBlockSelectionStart(), ownProps.clientId );
			} else {
				selectBlock( ownProps.clientId );
			}
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
	withFilters( 'editor.BlockListBlock' )
)( BlockListBlock );
