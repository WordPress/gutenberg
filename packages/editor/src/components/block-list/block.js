/**
 * External dependencies
 */
import classnames from 'classnames';
import { get, reduce, size, castArray, first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode, Fragment } from '@wordpress/element';
import {
	focus,
	isTextField,
	placeCaretAtHorizontalEdge,
	placeCaretAtVerticalEdge,
} from '@wordpress/dom';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import {
	cloneBlock,
	getBlockType,
	getSaveElement,
	isReusableBlock,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { withFilters } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockEdit from '../block-edit';
import BlockMover from '../block-mover';
import BlockDropZone from '../block-drop-zone';
import BlockSettingsMenu from '../block-settings-menu';
import BlockInvalidWarning from './block-invalid-warning';
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

export class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setBlockListRef = this.setBlockListRef.bind( this );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.hideHoverEffects = this.hideHoverEffects.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
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

	componentDidMount() {
		if ( this.props.isSelected ) {
			this.focusTabbable();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isTypingWithinBlock || this.props.isSelected ) {
			this.hideHoverEffects();
		}

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

		this.props.blockRef( node, this.props.clientId );
	}

	bindBlockNode( node ) {
		// Disable reason: The block element uses a component to manage event
		// nesting, but we rely on a raw DOM node for focusing.
		//
		// eslint-disable-next-line react/no-find-dom-node
		this.node = findDOMNode( node );
	}

	/**
	 * When a block becomes selected, transition focus to an inner tabbable.
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
			placeCaretAtHorizontalEdge( target, true );
			placeCaretAtVerticalEdge( target, true );
		}
	}

	setAttributes( attributes ) {
		const { block, onChange } = this.props;
		const type = getBlockType( block.name );
		onChange( block.clientId, attributes );

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
		const { isPartOfMultiSelection, isSelected } = this.props;
		const { isHovered } = this.state;

		if ( isHovered || isPartOfMultiSelection || isSelected ||
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
		const { block, previousBlockClientId, nextBlockClientId, onMerge } = this.props;

		// Do nothing when it's the first block.
		if (
			( ! forward && ! previousBlockClientId ) ||
			( forward && ! nextBlockClientId )
		) {
			return;
		}

		if ( forward ) {
			onMerge( block.clientId, nextBlockClientId );
		} else {
			onMerge( previousBlockClientId, block.clientId );
		}
	}

	insertBlocksAfter( blocks ) {
		this.props.onInsertBlocks( blocks, this.props.order + 1 );
	}

	/**
	 * Marks the block as selected when focused and not already selected. This
	 * specifically handles the case where block does not set focus on its own
	 * (via `setFocus`), typically if there is no focusable input in the block.
	 *
	 * @return {void}
	 */
	onFocus() {
		if ( ! this.props.isSelected && ! this.props.isPartOfMultiSelection ) {
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
				this.props.onShiftSelection( this.props.clientId );
				event.preventDefault();
			}
		} else {
			this.props.onSelectionStart( this.props.clientId );

			// Allow user to escape out of a multi-selection to a singular
			// selection of a block via click. This is handled here since
			// onFocus excludes blocks involved in a multiselection, as
			// focus can be incurred by starting a multiselection (focus
			// moved to first block's multi-controls).
			if ( this.props.isPartOfMultiSelection ) {
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
				this.props.onInsertDefaultBlockAfter();
				event.preventDefault();
				break;

			case BACKSPACE:
			case DELETE:
				// Remove block on backspace.
				const { clientId, onRemove, previousBlockClientId, onSelect } = this.props;
				onRemove( clientId );

				if ( previousBlockClientId ) {
					onSelect( previousBlockClientId, -1 );
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
			clientId,
			rootClientId,
			layout,
			isSelected,
			isPartOfMultiSelection,
			isFirstMultiSelected,
			isTypingWithinBlock,
			isMultiSelecting,
			hoverArea,
			isLargeViewport,
			isEmptyDefaultBlock,
			isMovable,
			isPreviousBlockADefaultEmptyBlock,
			hasSelectedInnerBlock,
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
		const showEmptyBlockSideInserter = ( isSelected || isHovered ) && isEmptyDefaultBlock;
		const showSideInserter = ( isSelected || isHovered ) && isEmptyDefaultBlock;
		const shouldAppearSelected = ! showSideInserter && isSelected && ! isTypingWithinBlock;
		const shouldAppearSelectedParent = ! showSideInserter && hasSelectedInnerBlock && ! isTypingWithinBlock;
		// We render block movers and block settings to keep them tabbale even if hidden
		const shouldRenderMovers = ( isSelected || hoverArea === 'left' ) && ! showEmptyBlockSideInserter && ! isMultiSelecting && ! isPartOfMultiSelection && ! isTypingWithinBlock;
		const shouldRenderBlockSettings = ( isSelected || hoverArea === 'right' ) && ! isMultiSelecting && ! isPartOfMultiSelection;
		const shouldShowBreadcrumb = isHovered && ! isEmptyDefaultBlock;
		const shouldShowContextualToolbar = ! showSideInserter && ( ( isSelected && ! isTypingWithinBlock && isValid ) || isFirstMultiSelected ) && ( ! hasFixedToolbar || ! isLargeViewport );
		const shouldShowMobileToolbar = shouldAppearSelected;
		const { error, dragging } = this.state;

		// Insertion point can only be made visible when the side inserter is
		// not present, and either the block is at the extent of a selection or
		// is the first block in the top-level list rendering.
		const shouldShowInsertionPoint = ( isPartOfMultiSelection && isFirst ) || ! isPartOfMultiSelection;
		const canShowInBetweenInserter = ! isEmptyDefaultBlock && ! isPreviousBlockADefaultEmptyBlock;

		// Generate the wrapper class names handling the different states of the block.
		const wrapperClassName = classnames( 'editor-block-list__block', {
			'has-warning': ! isValid || !! error,
			'is-selected': shouldAppearSelected,
			'is-multi-selected': isPartOfMultiSelection,
			'is-selected-parent': shouldAppearSelectedParent,
			'is-hovered': isHovered && ! isEmptyDefaultBlock,
			'is-reusable': isReusableBlock( blockType ),
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
		const blockElementId = `block-${ clientId }`;

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
				aria-label={ blockLabel }
				childHandledEvents={ [
					'onDragStart',
					'onMouseDown',
				] }
				{ ...wrapperProps }
			>
				{ ! isPartOfMultiSelection && isMovable && (
					<BlockDraggable
						rootClientId={ rootClientId }
						index={ order }
						clientId={ clientId }
						layout={ layout }
						onDragStart={ this.onDragStart }
						onDragEnd={ this.onDragEnd }
						isDragging={ dragging }
						elementId={ blockElementId }
					/>
				) }
				{ shouldShowInsertionPoint && (
					<BlockInsertionPoint
						clientId={ clientId }
						rootClientId={ rootClientId }
						layout={ layout }
						canShowInserter={ canShowInBetweenInserter }
						onInsert={ this.hideHoverEffects }
					/>
				) }
				<BlockDropZone
					index={ order }
					rootClientId={ rootClientId }
					layout={ layout }
				/>
				{ shouldRenderMovers && (
					<BlockMover
						clientIds={ clientId }
						rootClientId={ rootClientId }
						layout={ layout }
						isFirst={ isFirst }
						isLast={ isLast }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'left' }
					/>
				) }
				{ shouldRenderBlockSettings && (
					<BlockSettingsMenu
						clientIds={ clientId }
						rootClientId={ rootClientId }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'right' || isTypingWithinBlock }
					/>
				) }
				{ shouldShowBreadcrumb && (
					<BlockBreadcrumb
						clientId={ clientId }
						isHidden={ ! ( isHovered || isSelected ) || hoverArea !== 'left' }
					/>
				) }
				{ shouldShowContextualToolbar && <BlockContextualToolbar /> }
				{ isFirstMultiSelected && (
					<BlockMultiControls rootClientId={ rootClientId } />
				) }
				<IgnoreNestedEvents
					ref={ this.bindBlockNode }
					onDragStart={ this.preventDrag }
					onMouseDown={ this.onPointerDown }
					className="editor-block-list__block-edit"
					data-block={ clientId }
				>
					<BlockCrashBoundary onError={ this.onBlockError }>
						{ isValid && mode === 'visual' && (
							<BlockEdit
								name={ blockName }
								isSelected={ isSelected }
								attributes={ block.attributes }
								setAttributes={ this.setAttributes }
								insertBlocksAfter={ isLocked ? undefined : this.insertBlocksAfter }
								onReplace={ isLocked ? undefined : onReplace }
								mergeBlocks={ isLocked ? undefined : this.mergeBlocks }
								clientId={ clientId }
								isSelectionEnabled={ this.props.isSelectionEnabled }
								toggleSelection={ this.props.toggleSelection }
							/>
						) }
						{ isValid && mode === 'html' && (
							<BlockHtml clientId={ clientId } />
						) }
						{ ! isValid && [
							<div key="invalid-preview">
								{ getSaveElement( blockType, block.attributes ) }
							</div>,
							<BlockInvalidWarning
								key="invalid-warning"
								block={ block }
							/>,
						] }
					</BlockCrashBoundary>
					{ shouldShowMobileToolbar && (
						<BlockMobileToolbar
							rootClientId={ rootClientId }
							clientId={ clientId }
						/>
					) }
					{ !! error && <BlockCrashWarning /> }
				</IgnoreNestedEvents>
				{ showEmptyBlockSideInserter && (
					<Fragment>
						<div className="editor-block-list__side-inserter">
							<InserterWithShortcuts
								clientId={ clientId }
								rootClientId={ rootClientId }
								layout={ layout }
								onToggle={ this.selectOnOpen }
							/>
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

const applyWithSelect = withSelect( ( select, { clientId, rootClientId } ) => {
	const {
		isBlockSelected,
		getPreviousBlockClientId,
		getNextBlockClientId,
		getBlock,
		isAncestorMultiSelected,
		isBlockMultiSelected,
		isFirstMultiSelectedBlock,
		isMultiSelecting,
		isTyping,
		getBlockIndex,
		getEditedPostAttribute,
		getBlockMode,
		isSelectionEnabled,
		getSelectedBlocksInitialCaretPosition,
		getEditorSettings,
		hasSelectedInnerBlock,
		getTemplateLock,
	} = select( 'core/editor' );
	const isSelected = isBlockSelected( clientId );
	const isParentOfSelectedBlock = hasSelectedInnerBlock( clientId );
	const { hasFixedToolbar } = getEditorSettings();
	const block = getBlock( clientId );
	const previousBlockClientId = getPreviousBlockClientId( clientId );
	const previousBlock = getBlock( previousBlockClientId );
	const templateLock = getTemplateLock( rootClientId );

	return {
		nextBlockClientId: getNextBlockClientId( clientId ),
		isPartOfMultiSelection: isBlockMultiSelected( clientId ) || isAncestorMultiSelected( clientId ),
		isFirstMultiSelected: isFirstMultiSelectedBlock( clientId ),
		isMultiSelecting: isMultiSelecting(),
		hasSelectedInnerBlock: isParentOfSelectedBlock,
		// We only care about this prop when the block is selected
		// Thus to avoid unnecessary rerenders we avoid updating the prop if the block is not selected.
		isTypingWithinBlock: ( isSelected || isParentOfSelectedBlock ) && isTyping(),
		order: getBlockIndex( clientId, rootClientId ),
		meta: getEditedPostAttribute( 'meta' ),
		mode: getBlockMode( clientId ),
		isSelectionEnabled: isSelectionEnabled(),
		initialPosition: getSelectedBlocksInitialCaretPosition(),
		isEmptyDefaultBlock: block && isUnmodifiedDefaultBlock( block ),
		isPreviousBlockADefaultEmptyBlock: previousBlock && isUnmodifiedDefaultBlock( previousBlock ),
		isMovable: 'all' !== templateLock,
		isLocked: !! templateLock,
		previousBlockClientId,
		block,
		isSelected,
		hasFixedToolbar,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch, ownProps ) => {
	const {
		updateBlockAttributes,
		selectBlock,
		insertBlocks,
		insertDefaultBlock,
		removeBlock,
		mergeBlocks,
		replaceBlocks,
		editPost,
		toggleSelection,
	} = dispatch( 'core/editor' );

	return {
		onChange( clientId, attributes ) {
			updateBlockAttributes( clientId, attributes );
		},
		onSelect( clientId = ownProps.clientId, initialPosition ) {
			selectBlock( clientId, initialPosition );
		},
		onInsertBlocks( blocks, index ) {
			const { rootClientId, layout } = ownProps;
			blocks = blocks.map( ( block ) => cloneBlock( block, { layout } ) );
			insertBlocks( blocks, index, rootClientId );
		},
		onInsertDefaultBlockAfter() {
			const { order, rootClientId } = ownProps;
			insertDefaultBlock( {}, rootClientId, order + 1 );
		},
		onRemove( clientId ) {
			removeBlock( clientId );
		},
		onMerge( ...args ) {
			mergeBlocks( ...args );
		},
		onReplace( blocks ) {
			const { layout } = ownProps;
			blocks = castArray( blocks ).map( ( block ) => (
				cloneBlock( block, { layout } )
			) );
			replaceBlocks( [ ownProps.clientId ], blocks );
		},
		onMetaChange( meta ) {
			editPost( { meta } );
		},
		toggleSelection( selectionEnabled ) {
			toggleSelection( selectionEnabled );
		},
	};
} );

export default compose(
	applyWithSelect,
	applyWithDispatch,
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withFilters( 'editor.BlockListBlock' ),
	withHoverAreas,
)( BlockListBlock );
