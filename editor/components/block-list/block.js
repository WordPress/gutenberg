/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, reduce, size, castArray, first, last, noop } from 'lodash';
import tinymce from 'tinymce';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode, Fragment, compose } from '@wordpress/element';
import {
	keycodes,
	focus,
	isTextField,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
} from '@wordpress/utils';
import {
	BlockEdit,
	createBlock,
	cloneBlock,
	getBlockType,
	getSaveElement,
	isSharedBlock,
	isUnmodifiedDefaultBlock,
	withEditorSettings,
	getDefaultBlockName,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import BlockMover from '../block-mover';
import BlockDropZone from '../block-drop-zone';
import BlockSettingsMenu from '../block-settings-menu';
import InvalidBlockWarning from './invalid-block-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockHtml from './block-html';
import BlockBreadcrumb from './breadcrumb';
import BlockContextualToolbar from './block-contextual-toolbar';
import BlockMultiControls from './multi-controls';
import BlockMobileToolbar from './block-mobile-toolbar';
import BlockInsertionPoint from './insertion-point';
import BlockDraggable from './block-draggable';
import IgnoreNestedEvents from './ignore-nested-events';
import InserterWithShortcuts from '../inserter-with-shortcuts';
import Inserter from '../inserter';
import withHoverAreas from './with-hover-areas';
import { createInnerBlockList } from '../../utils/block-list';

const { BACKSPACE, DELETE, ENTER } = keycodes;

export class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setBlockListRef = this.setBlockListRef.bind( this );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.hideHoverEffects = this.hideHoverEffects.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.preventDrag = this.preventDrag.bind( this );
		this.onPointerDown = this.onPointerDown.bind( this );
		this.deleteOrInsertAfterWrapper = this.deleteOrInsertAfterWrapper.bind( this );
		this.onBlockError = this.onBlockError.bind( this );
		this.onTouchStart = this.onTouchStart.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onDragStart = this.onDragStart.bind( this );
		this.onDragEnd = this.onDragEnd.bind( this );
		this.selectOnOpen = this.selectOnOpen.bind( this );
		this.hadTouchStart = false;

		this.state = {
			error: null,
			dragging: false,
			isHovered: false,
		};
	}

	/**
	 * Provides context for descendent components for use in block rendering.
	 *
	 * @return {Object} Child context.
	 */
	getChildContext() {
		// Blocks may render their own BlockEdit, in which case we must provide
		// a mechanism for them to create their own InnerBlockList. BlockEdit
		// is defined in `@wordpress/blocks`, so to avoid a circular dependency
		// we inject this function via context.
		return {
			createInnerBlockList: ( uid ) => {
				const { renderBlockMenu } = this.props;
				return createInnerBlockList( uid, renderBlockMenu );
			},
		};
	}

	componentDidMount() {
		if ( this.props.isSelected ) {
			this.focusTabbable();
		}
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.isTypingWithinBlock || newProps.isSelected ) {
			this.hideHoverEffects();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isSelected && ! prevProps.isSelected ) {
			this.focusTabbable();
		}
	}

	setBlockListRef( node ) {
		// Disable reason: The root return element uses a component to manage
		// event nesting, but the parent block list layout needs the raw DOM
		// node to track multi-selection.
		//
		// eslint-disable-next-line react/no-find-dom-node
		node = findDOMNode( node );

		this.wrapperNode = node;

		this.props.blockRef( node, this.props.uid );
	}

	bindBlockNode( node ) {
		// Disable reason: The block element uses a component to manage event
		// nesting, but we rely on a raw DOM node for focusing.
		//
		// eslint-disable-next-line react/no-find-dom-node
		this.node = findDOMNode( node );
	}

	/**
	 * When a block becomces selected, transition focus to an inner tabbable.
	 */
	focusTabbable() {
		const { initialPosition } = this.props;

		// Focus is captured by the wrapper node, so while focus transition
		// should only consider tabbables within editable display, since it
		// may be the wrapper itself or a side control which triggered the
		// focus event, don't unnecessary transition to an inner tabbable.
		if ( this.wrapperNode.contains( document.activeElement ) ) {
			return;
		}

		// Find all tabbables within node.
		const textInputs = focus.tabbable.find( this.node ).filter( isTextField );

		// If reversed (e.g. merge via backspace), use the last in the set of
		// tabbables.
		const isReverse = -1 === initialPosition;
		const target = ( isReverse ? last : first )( textInputs );

		if ( ! target ) {
			this.wrapperNode.focus();
			return;
		}

		target.focus();

		// In reverse case, need to explicitly place caret position.
		if ( isReverse ) {
			// Special case RichText component because the placeCaret utilities
			// aren't working correctly. When merging two paragraph blocks, the
			// focus is not moved to the correct position.
			const editor = tinymce.get( target.getAttribute( 'id' ) );
			if ( editor ) {
				editor.selection.select( editor.getBody(), true );
				editor.selection.collapse( false );
			} else {
				placeCaretAtHorizontalEdge( target, true );
				placeCaretAtVerticalEdge( target, true );
			}
		}
	}

	setAttributes( attributes ) {
		const { block, onChange } = this.props;
		const type = getBlockType( block.name );
		onChange( block.uid, attributes );

		const metaAttributes = reduce( attributes, ( result, value, key ) => {
			if ( get( type, [ 'attributes', key, 'source' ] ) === 'meta' ) {
				result[ type.attributes[ key ].meta ] = value;
			}

			return result;
		}, {} );

		if ( size( metaAttributes ) ) {
			this.props.onMetaChange( {
				...this.props.meta,
				...metaAttributes,
			} );
		}
	}

	onTouchStart() {
		// Detect touchstart to disable hover on iOS
		this.hadTouchStart = true;
	}

	onClick() {
		// Clear touchstart detection
		// Browser will try to emulate mouse events also see https://www.html5rocks.com/en/mobile/touchandmouse/
		this.hadTouchStart = false;
	}

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
	maybeHover() {
		const { isMultiSelected, isSelected } = this.props;
		const { isHovered } = this.state;

		if ( isHovered || isMultiSelected || isSelected ||
				this.props.isMultiSelecting || this.hadTouchStart ) {
			return;
		}

		this.setState( { isHovered: true } );
	}

	/**
	 * Sets the block state as unhovered if currently hovering. There are cases
	 * where mouseleave may occur but the block is not hovered (multi-select),
	 * so to avoid unnecesary renders, the state is only set if hovered.
	 */
	hideHoverEffects() {
		if ( this.state.isHovered ) {
			this.setState( { isHovered: false } );
		}
	}

	mergeBlocks( forward = false ) {
		const { block, previousBlockUid, nextBlockUid, onMerge } = this.props;

		// Do nothing when it's the first block.
		if (
			( ! forward && ! previousBlockUid ) ||
			( forward && ! nextBlockUid )
		) {
			return;
		}

		if ( forward ) {
			onMerge( block.uid, nextBlockUid );
		} else {
			onMerge( previousBlockUid, block.uid );
		}
	}

	/**
	 * Marks the block as selected when focused and not already selected. This
	 * specifically handles the case where block does not set focus on its own
	 * (via `setFocus`), typically if there is no focusable input in the block.
	 *
	 * @return {void}
	 */
	onFocus() {
		if ( ! this.props.isSelected && ! this.props.isMultiSelected ) {
			this.props.onSelect();
		}
	}

	/**
	 * Prevents default dragging behavior within a block to allow for multi-
	 * selection to take effect unhampered.
	 *
	 * @param {DragEvent} event Drag event.
	 *
	 * @return {void}
	 */
	preventDrag( event ) {
		event.preventDefault();
	}

	/**
	 * Begins tracking cursor multi-selection when clicking down within block.
	 *
	 * @param {MouseEvent} event A mousedown event.
	 *
	 * @return {void}
	 */
	onPointerDown( event ) {
		// Not the main button.
		// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
		if ( event.button !== 0 ) {
			return;
		}

		if ( event.shiftKey ) {
			if ( ! this.props.isSelected ) {
				this.props.onShiftSelection( this.props.uid );
				event.preventDefault();
			}
		} else {
			this.props.onSelectionStart( this.props.uid );

			// Allow user to escape out of a multi-selection to a singular
			// selection of a block via click. This is handled here since
			// onFocus excludes blocks involved in a multiselection, as
			// focus can be incurred by starting a multiselection (focus
			// moved to first block's multi-controls).
			if ( this.props.isMultiSelected ) {
				this.props.onSelect();
			}
		}
	}

	/**
	 * Interprets keydown event intent to remove or insert after block if key
	 * event occurs on wrapper node. This can occur when the block has no text
	 * fields of its own, particularly after initial insertion, to allow for
	 * easy deletion and continuous writing flow to add additional content.
	 *
	 * @param {KeyboardEvent} event Keydown event.
	 */
	deleteOrInsertAfterWrapper( event ) {
		const { keyCode, target } = event;

		if ( target !== this.wrapperNode || this.props.isLocked ) {
			return;
		}

		switch ( keyCode ) {
			case ENTER:
				// Insert default block after current block if enter and event
				// not already handled by descendant.
				this.props.onInsertBlocksAfter( [
					createBlock( getDefaultBlockName() ),
				] );
				event.preventDefault();
				break;

			case BACKSPACE:
			case DELETE:
				// Remove block on backspace.
				const { uid, onRemove, previousBlockUid, onSelect } = this.props;
				onRemove( uid );

				if ( previousBlockUid ) {
					onSelect( previousBlockUid, -1 );
				}
				event.preventDefault();
				break;
		}
	}

	onBlockError( error ) {
		this.setState( { error } );
	}

	onDragStart() {
		this.setState( { dragging: true } );
	}

	onDragEnd() {
		this.setState( { dragging: false } );
	}

	selectOnOpen( open ) {
		if ( open && ! this.props.isSelected ) {
			this.props.onSelect();
		}
	}

	render() {
		const {
			block,
			order,
			mode,
			hasFixedToolbar,
			isLocked,
			isFirst,
			isLast,
			uid,
			rootUID,
			layout,
			renderBlockMenu,
			isSelected,
			isMultiSelected,
			isFirstMultiSelected,
			isLastInSelection,
			isTypingWithinBlock,
			isMultiSelecting,
			hoverArea,
			isLargeViewport,
		} = this.props;
		const isHovered = this.state.isHovered && ! isMultiSelecting;
		const { name: blockName, isValid } = block;
		const blockType = getBlockType( blockName );
		// translators: %s: Type of block (i.e. Text, Image etc)
		const blockLabel = sprintf( __( 'Block: %s' ), blockType.title );
		// The block as rendered in the editor is composed of general block UI
		// (mover, toolbar, wrapper) and the display of the block content.

		// If the block is selected and we're typing the block should not appear.
		// Empty paragraph blocks should always show up as unselected.
		const isEmptyDefaultBlock = isUnmodifiedDefaultBlock( block );
		const isSelectedNotTyping = isSelected && ! isTypingWithinBlock;
		const showSideInserter = ( isSelected || isHovered ) && isEmptyDefaultBlock;
		const shouldAppearSelected = ! showSideInserter && isSelectedNotTyping;
		// We render block movers and block settings to keep them tabbale even if hidden
		const shouldRenderMovers = ( isSelected || hoverArea === 'left' ) && ! showSideInserter && ! isMultiSelecting && ! isMultiSelected;
		const shouldRenderBlockSettings = ( isSelected || hoverArea === 'right' ) && ! showSideInserter && ! isMultiSelecting && ! isMultiSelected;
		const shouldShowBreadcrumb = isHovered;
		const shouldShowContextualToolbar = shouldAppearSelected && isValid && ( ! hasFixedToolbar || ! isLargeViewport );
		const shouldShowMobileToolbar = shouldAppearSelected;
		const { error, dragging } = this.state;

		// Insertion point can only be made visible when the side inserter is
		// not present, and either the block is at the extent of a selection or
		// is the first block in the top-level list rendering.
		const shouldShowInsertionPoint = (
			( ! isMultiSelected && ! isFirst ) ||
			( isMultiSelected && isLastInSelection ) ||
			( isFirst && ! rootUID && ! isEmptyDefaultBlock )
		);

		// Generate the wrapper class names handling the different states of the block.
		const wrapperClassName = classnames( 'editor-block-list__block', {
			'has-warning': ! isValid || !! error,
			'is-selected': shouldAppearSelected,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isHovered,
			'is-shared': isSharedBlock( blockType ),
			'is-hidden': dragging,
			'is-typing': isTypingWithinBlock,
		} );

		const { onReplace } = this.props;

		// Determine whether the block has props to apply to the wrapper.
		let wrapperProps = this.props.wrapperProps;
		if ( blockType.getEditWrapperProps ) {
			wrapperProps = {
				...wrapperProps,
				...blockType.getEditWrapperProps( block.attributes ),
			};
		}
		const blockElementId = `block-${ uid }`;

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
				ref={ this.setBlockListRef }
				onMouseOver={ this.maybeHover }
				onMouseOverHandled={ this.hideHoverEffects }
				onMouseLeave={ this.hideHoverEffects }
				className={ wrapperClassName }
				data-type={ block.name }
				onTouchStart={ this.onTouchStart }
				onFocus={ this.onFocus }
				onClick={ this.onClick }
				onKeyDown={ this.deleteOrInsertAfterWrapper }
				tabIndex="0"
				childHandledEvents={ [
					'onDragStart',
					'onMouseDown',
				] }
				{ ...wrapperProps }
			>
				{ ! isMultiSelected && (
					<BlockDraggable
						rootUID={ rootUID }
						index={ order }
						uid={ uid }
						layout={ layout }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ blockElementId }
					/>
				) }
				{ shouldShowInsertionPoint && (
					<BlockInsertionPoint
						uid={ uid }
						rootUID={ rootUID }
						layout={ layout }
					/>
				) }
				<BlockDropZone
					index={ order }
					rootUID={ rootUID }
					layout={ layout }
				/>
				{ shouldRenderMovers && (
					<BlockMover
						uids={ uid }
						rootUID={ rootUID }
						layout={ layout }
						isFirst={ isFirst }
						isLast={ isLast }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'left' }
					/>
				) }
				{ shouldRenderBlockSettings && (
					<BlockSettingsMenu
						uids={ uid }
						rootUID={ rootUID }
						renderBlockMenu={ renderBlockMenu }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'right' }
					/>
				) }
				{ shouldShowBreadcrumb && <BlockBreadcrumb uid={ uid } isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'left' } /> }
				{ shouldShowContextualToolbar && <BlockContextualToolbar /> }
				{ isFirstMultiSelected && <BlockMultiControls rootUID={ rootUID } /> }
				<IgnoreNestedEvents
					ref={ this.bindBlockNode }
					onDragStart={ this.preventDrag }
					onMouseDown={ this.onPointerDown }
					className="editor-block-list__block-edit"
					aria-label={ blockLabel }
					data-block={ uid }
				>

					<BlockCrashBoundary onError={ this.onBlockError }>
						{ isValid && mode === 'visual' && (
							<BlockEdit
								name={ blockName }
								isSelected={ isSelected }
								attributes={ block.attributes }
								setAttributes={ this.setAttributes }
								insertBlocksAfter={ isLocked ? undefined : this.props.onInsertBlocksAfter }
								onReplace={ isLocked ? undefined : onReplace }
								mergeBlocks={ isLocked ? undefined : this.mergeBlocks }
								id={ uid }
								isSelectionEnabled={ this.props.isSelectionEnabled }
								toggleSelection={ this.props.toggleSelection }
							/>
						) }
						{ isValid && mode === 'html' && (
							<BlockHtml uid={ uid } />
						) }
						{ ! isValid && [
							<div key="invalid-preview">
								{ getSaveElement( blockType, block.attributes ) }
							</div>,
							<InvalidBlockWarning
								key="invalid-warning"
								block={ block }
							/>,
						] }
					</BlockCrashBoundary>
					{ shouldShowMobileToolbar && (
						<BlockMobileToolbar
							rootUID={ rootUID }
							uid={ uid }
							renderBlockMenu={ renderBlockMenu }
						/>
					) }
				</IgnoreNestedEvents>
				{ !! error && <BlockCrashWarning /> }
				{ showSideInserter && (
					<Fragment>
						<div className="editor-block-list__side-inserter">
							<InserterWithShortcuts uid={ uid } layout={ layout } onToggle={ this.selectOnOpen } />
						</div>
						<div className="editor-block-list__empty-block-inserter">
							<Inserter
								position="top right"
								onToggle={ this.selectOnOpen }
							/>
						</div>
					</Fragment>
				) }
			</IgnoreNestedEvents>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

const applyWithSelect = withSelect( ( select, { uid, rootUID } ) => {
	const {
		isBlockSelected,
		getPreviousBlockUid,
		getNextBlockUid,
		getBlock,
		isBlockMultiSelected,
		isFirstMultiSelectedBlock,
		isMultiSelecting,
		isTyping,
		getBlockIndex,
		getEditedPostAttribute,
		getBlockMode,
		isSelectionEnabled,
		getSelectedBlocksInitialCaretPosition,
		getBlockSelectionEnd,
		getBlockRootUID,
	} = select( 'core/editor' );
	const isSelected = isBlockSelected( uid );
	return {
		previousBlockUid: getPreviousBlockUid( uid ),
		nextBlockUid: getNextBlockUid( uid ),
		block: getBlock( uid ),
		isMultiSelected: isBlockMultiSelected( uid ),
		isFirstMultiSelected: isFirstMultiSelectedBlock( uid ),
		isMultiSelecting: isMultiSelecting(),
		isLastInSelection: getBlockSelectionEnd() === uid,
		// We only care about this prop when the block is selected
		// Thus to avoid unnecessary rerenders we avoid updating the prop if the block is not selected.
		isTypingWithinBlock: isSelected && isTyping(),
		order: getBlockIndex( uid, rootUID ),
		meta: getEditedPostAttribute( 'meta' ),
		mode: getBlockMode( uid ),
		isSelectionEnabled: isSelectionEnabled(),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		isSelected,
		rootUIDOfRoot: getBlockRootUID( rootUID ),
		orderOfRoot: getBlockIndex( rootUID, getBlockRootUID( rootUID ) ),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch, ownProps ) => {
	const {
		updateBlockAttributes,
		selectBlock,
		insertBlocks,
		removeBlock,
		mergeBlocks,
		replaceBlocks,
		editPost,
		toggleSelection,
		moveBlockToPosition,
	} = dispatch( 'core/editor' );

	return {
		onChange( uid, attributes ) {
			updateBlockAttributes( uid, attributes );
		},
		onSelect( uid = ownProps.uid, initialPosition ) {
			selectBlock( uid, initialPosition );
		},
		onInsertBlocksAfter( blocks ) {
			const { block, order, isLast, rootUID, orderOfRoot, rootUIDOfRoot, layout } = ownProps;

			blocks = blocks.map( ( oldBlock ) => cloneBlock( oldBlock, { layout } ) );

			// If the current block is the last nested empty paragraph block,
			// and we're about to insert another empty paragraph block, then
			// move the empty paragraph block behind the wrapping block.
			// This is a way for the user to escape out of wrapping blocks.
			if (
				rootUID && isLast && blocks.length === 1 &&
				isUnmodifiedDefaultBlock( first( blocks ) ) &&
				isUnmodifiedDefaultBlock( block )
			) {
				moveBlockToPosition( block.uid, rootUID, rootUIDOfRoot, layout, orderOfRoot + 1 );
			} else {
				insertBlocks( blocks, order + 1, rootUID );
			}
		},
		onRemove( uid ) {
			removeBlock( uid );
		},
		onMerge( ...args ) {
			mergeBlocks( ...args );
		},
		onReplace( blocks ) {
			const { layout } = ownProps;
			blocks = castArray( blocks ).map( ( block ) => (
				cloneBlock( block, { layout } )
			) );
			replaceBlocks( [ ownProps.uid ], blocks );
		},
		onMetaChange( meta ) {
			editPost( { meta } );
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

BlockListBlock.childContextTypes = {
	createInnerBlockList: noop,
};

export default compose(
	applyWithSelect,
	applyWithDispatch,
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withEditorSettings( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
			hasFixedToolbar: settings.hasFixedToolbar,
		};
	} ),
	withFilters( 'editor.BlockListBlock' ),
	withHoverAreas,
)( BlockListBlock );
