/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last } from 'lodash';
import { animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useLayoutEffect, useState, useContext } from '@wordpress/element';
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
import { withFilters } from '@wordpress/components';
import {
	withDispatch,
	withSelect,
	useSelect,
	useDispatch,
} from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { compose, pure, ifCondition } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockInvalidWarning from './block-invalid-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import { isInsideRootBlock } from '../../utils/dom';
import useMovingAnimation from './moving-animation';
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
	moverDirection,
	isLocked,
	clientId,
	isSelected,
	isMultiSelected,
	isPartOfMultiSelection,
	isFirstMultiSelected,
	isTypingWithinBlock,
	isEmptyDefaultBlock,
	isAncestorOfSelectedBlock,
	isSelectionEnabled,
	className,
	name,
	index,
	isValid,
	attributes,
	initialPosition,
	wrapperProps,
	setAttributes,
	onReplace,
	onInsertBlocksAfter,
	onMerge,
	onRemove,
	onInsertDefaultBlockAfter,
	toggleSelection,
	animateOnChange,
	enableAnimation,
	isNavigationMode,
	isMultiSelecting,
	hasSelectedUI = true,
} ) {
	const onSelectionStart = useContext( Context );
	// In addition to withSelect, we should favor using useSelect in this component going forward
	// to avoid leaking new props to the public API (editor.BlockListBlock filter)
	const { isDraggingBlocks } = useSelect( ( select ) => {
		return {
			isDraggingBlocks: select( 'core/block-editor' ).isDraggingBlocks(),
		};
	}, [] );
	const {
		__unstableSetSelectedMountedBlock,
	} = useDispatch( 'core/block-editor' );

	// Reference of the wrapper
	const wrapper = useRef( null );

	useLayoutEffect( () => {
		if ( isSelected || isFirstMultiSelected ) {
			__unstableSetSelectedMountedBlock( clientId );
		}
	}, [ isSelected, isFirstMultiSelected ] );

	// Reference to the block edit node
	const blockNodeRef = useRef();

	// Handling the error state
	const [ hasError, setErrorState ] = useState( false );
	const onBlockError = () => setErrorState( true );

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
		if ( ! isMultiSelecting && ! isNavigationMode ) {
			if ( isSelected ) {
				focusTabbable( ! isMounting.current );
			} else if ( isFirstMultiSelected ) {
				wrapper.current.focus();
			}
		}

		isMounting.current = false;
	}, [
		isSelected,
		isFirstMultiSelected,
		isMultiSelecting,
		isNavigationMode,
	] );

	// Block Reordering animation
	const animationStyle = useMovingAnimation( wrapper, isSelected || isPartOfMultiSelection, isSelected || isFirstMultiSelected, enableAnimation, animateOnChange );

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

	const isUnregisteredBlock = name === getUnregisteredTypeHandlerName();

	// If the block is selected and we're typing the block should not appear.
	// Empty paragraph blocks should always show up as unselected.
	const showEmptyBlockSideInserter = ! isNavigationMode && isSelected && isEmptyDefaultBlock && isValid;
	const shouldAppearSelected =
		! isFocusMode &&
		! showEmptyBlockSideInserter &&
		isSelected &&
		! isTypingWithinBlock;

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
			getBlockMode,
			isSelectionEnabled,
			getSelectedBlocksInitialCaretPosition,
			getSettings,
			hasSelectedInnerBlock,
			getTemplateLock,
			getBlockIndex,
			__unstableGetBlockWithoutInnerBlocks,
			isNavigationMode,
		} = select( 'core/block-editor' );

		const block = __unstableGetBlockWithoutInnerBlocks( clientId );
		const isSelected = isBlockSelected( clientId );
		const { focusMode, isRTL } = getSettings();
		const templateLock = getTemplateLock( rootClientId );
		const checkDeep = true;

		// "ancestor" is the more appropriate label due to "deep" check
		const isAncestorOfSelectedBlock = hasSelectedInnerBlock( clientId, checkDeep );
		const index = getBlockIndex( clientId, rootClientId );

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

			mode: getBlockMode( clientId ),
			isSelectionEnabled: isSelectionEnabled(),
			initialPosition: isSelected ? getSelectedBlocksInitialCaretPosition() : null,
			isEmptyDefaultBlock:
				name && isUnmodifiedDefaultBlock( { name, attributes } ),
			isLocked: !! templateLock,
			isFocusMode: focusMode && isLargeViewport,
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
		};
	}
);

const applyWithDispatch = withDispatch( ( dispatch, ownProps, { select } ) => {
	const {
		updateBlockAttributes,
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
