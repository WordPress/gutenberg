/**
 * External dependencies
 */
import classnames from 'classnames';
import { first, last, omit } from 'lodash';
import { animated } from 'react-spring/web.cjs';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useEffect,
	useLayoutEffect,
	useState,
	useContext,
} from '@wordpress/element';
import { focus, isTextField, placeCaretAtHorizontalEdge } from '@wordpress/dom';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import {
	getBlockType,
	getSaveElement,
	isReusableBlock,
	isUnmodifiedDefaultBlock,
	getUnregisteredTypeHandlerName,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect, useSelect } from '@wordpress/data';
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
import { Context, BlockNodes } from './root-container';

function BlockListBlock( {
	mode,
	isFocusMode,
	isLocked,
	clientId,
	isSelected,
	isMultiSelected,
	isPartOfMultiSelection,
	isFirstMultiSelected,
	isLastMultiSelected,
	isTypingWithinBlock,
	isEmptyDefaultBlock,
	isAncestorOfSelectedBlock,
	isSelectionEnabled,
	className,
	name,
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
	const [ , setBlockNodes ] = useContext( BlockNodes );
	// In addition to withSelect, we should favor using useSelect in this component going forward
	// to avoid leaking new props to the public API (editor.BlockListBlock filter)
	const { isDraggingBlocks } = useSelect( ( select ) => {
		return {
			isDraggingBlocks: select( 'core/block-editor' ).isDraggingBlocks(),
		};
	}, [] );

	// Reference of the wrapper
	const wrapper = useRef( null );

	// Provide the selected node, or the first and last nodes of a multi-
	// selection, so it can be used to position the contextual block toolbar.
	// We only provide what is necessary, and remove the nodes again when they
	// are no longer selected.
	useLayoutEffect( () => {
		if ( isSelected || isFirstMultiSelected || isLastMultiSelected ) {
			const node = wrapper.current;
			setBlockNodes( ( nodes ) => ( { ...nodes, [ clientId ]: node } ) );
			return () => {
				setBlockNodes( ( nodes ) => omit( nodes, clientId ) );
			};
		}
	}, [ isSelected, isFirstMultiSelected, isLastMultiSelected ] );

	// Handling the error state
	const [ hasError, setErrorState ] = useState( false );
	const onBlockError = () => setErrorState( true );

	const blockType = getBlockType( name );
	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockType.title );

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
			.find( wrapper.current )
			.filter( isTextField )
			// Exclude inner blocks
			.filter(
				( node ) =>
					! ignoreInnerBlocks ||
					isInsideRootBlock( wrapper.current, node )
			);

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
		if ( ! isMultiSelecting && ! isNavigationMode && isSelected ) {
			focusTabbable( ! isMounting.current );
		}

		isMounting.current = false;
	}, [ isSelected, isMultiSelecting, isNavigationMode ] );

	// Block Reordering animation
	const animationStyle = useMovingAnimation(
		wrapper,
		isSelected || isPartOfMultiSelection,
		isSelected || isFirstMultiSelected,
		enableAnimation,
		animateOnChange
	);

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
	const showEmptyBlockSideInserter =
		! isNavigationMode && isSelected && isEmptyDefaultBlock && isValid;
	const shouldAppearSelected =
		! isFocusMode &&
		! showEmptyBlockSideInserter &&
		isSelected &&
		! isTypingWithinBlock;

	const isDragging =
		isDraggingBlocks && ( isSelected || isPartOfMultiSelection );

	// Determine whether the block has props to apply to the wrapper.
	if ( blockType.getEditWrapperProps ) {
		wrapperProps = {
			...wrapperProps,
			...blockType.getEditWrapperProps( attributes ),
		};
	}

	const isAligned = wrapperProps && wrapperProps[ 'data-align' ];

	// The wp-block className is important for editor styles.
	// Generate the wrapper class names handling the different states of the block.
	const wrapperClassName = classnames(
		'wp-block block-editor-block-list__block',
		{
			'has-selected-ui': hasSelectedUI,
			'has-warning': ! isValid || !! hasError || isUnregisteredBlock,
			'is-selected': shouldAppearSelected && hasSelectedUI,
			'is-multi-selected': isMultiSelected,
			'is-reusable': isReusableBlock( blockType ),
			'is-dragging': isDragging,
			'is-typing': isTypingWithinBlock,
			'is-focused':
				isFocusMode && ( isSelected || isAncestorOfSelectedBlock ),
			'is-focus-mode': isFocusMode,
			'has-child-selected': isAncestorOfSelectedBlock,
			'is-block-collapsed': isAligned,
		},
		className
	);

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

	// For aligned blocks, provide a wrapper element so the block can be
	// positioned relative to the block column. This is enabled with the
	// .is-block-content className.
	if ( isAligned ) {
		blockEdit = <div className="is-block-content">{ blockEdit }</div>;
	}

	if ( mode !== 'visual' ) {
		blockEdit = <div style={ { display: 'none' } }>{ blockEdit }</div>;
	}

	return (
		<animated.div
			id={ blockElementId }
			ref={ wrapper }
			className={ wrapperClassName }
			data-block={ clientId }
			data-type={ name }
			// Only allow shortcuts when a blocks is selected and not locked.
			onKeyDown={ isSelected && ! isLocked ? onKeyDown : undefined }
			// Only allow selection to be started from a selected block.
			onMouseLeave={ isSelected ? onMouseLeave : undefined }
			tabIndex="0"
			aria-label={ blockLabel }
			role="group"
			{ ...wrapperProps }
			style={
				wrapperProps && wrapperProps.style
					? {
							...wrapperProps.style,
							...animationStyle,
					  }
					: animationStyle
			}
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
			getLastMultiSelectedBlockClientId,
			isTyping,
			getBlockMode,
			isSelectionEnabled,
			getSelectedBlocksInitialCaretPosition,
			getSettings,
			hasSelectedInnerBlock,
			getTemplateLock,
			__unstableGetBlockWithoutInnerBlocks,
			isNavigationMode,
		} = select( 'core/block-editor' );

		const block = __unstableGetBlockWithoutInnerBlocks( clientId );
		const isSelected = isBlockSelected( clientId );
		const { focusMode, isRTL } = getSettings();
		const templateLock = getTemplateLock( rootClientId );
		const checkDeep = true;

		// "ancestor" is the more appropriate label due to "deep" check
		const isAncestorOfSelectedBlock = hasSelectedInnerBlock(
			clientId,
			checkDeep
		);

		// The fallback to `{}` is a temporary fix.
		// This function should never be called when a block is not present in the state.
		// It happens now because the order in withSelect rendering is not correct.
		const { name, attributes, isValid } = block || {};

		return {
			isMultiSelected: isBlockMultiSelected( clientId ),
			isPartOfMultiSelection:
				isBlockMultiSelected( clientId ) ||
				isAncestorMultiSelected( clientId ),
			isFirstMultiSelected: isFirstMultiSelectedBlock( clientId ),
			isLastMultiSelected:
				getLastMultiSelectedBlockClientId() === clientId,

			// We only care about this prop when the block is selected
			// Thus to avoid unnecessary rerenders we avoid updating the prop if the block is not selected.
			isTypingWithinBlock:
				( isSelected || isAncestorOfSelectedBlock ) && isTyping(),

			mode: getBlockMode( clientId ),
			isSelectionEnabled: isSelectionEnabled(),
			initialPosition: isSelected
				? getSelectedBlocksInitialCaretPosition()
				: null,
			isEmptyDefaultBlock:
				name && isUnmodifiedDefaultBlock( { name, attributes } ),
			isLocked: !! templateLock,
			isFocusMode: focusMode && isLargeViewport,
			isNavigationMode: isNavigationMode(),
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
			const { getBlockIndex } = select( 'core/block-editor' );
			const index = getBlockIndex( clientId, rootClientId );
			insertDefaultBlock( {}, rootClientId, index + 1 );
		},
		onInsertBlocksAfter( blocks ) {
			const { clientId, rootClientId } = ownProps;
			const { getBlockIndex } = select( 'core/block-editor' );
			const index = getBlockIndex( clientId, rootClientId );
			insertBlocks( blocks, index + 1, rootClientId );
		},
		onRemove( clientId ) {
			removeBlock( clientId );
		},
		onMerge( forward ) {
			const { clientId } = ownProps;
			const { getPreviousBlockClientId, getNextBlockClientId } = select(
				'core/block-editor'
			);

			if ( forward ) {
				const nextBlockClientId = getNextBlockClientId( clientId );
				if ( nextBlockClientId ) {
					mergeBlocks( clientId, nextBlockClientId );
				}
			} else {
				const previousBlockClientId = getPreviousBlockClientId(
					clientId
				);
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
