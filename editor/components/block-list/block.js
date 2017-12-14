/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { get, partial, reduce, size } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, compose, createElement } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';
import {
	getBlockType,
	BlockEdit,
	getBlockDefaultClassname,
	createBlock,
	hasBlockSupport,
	isReusableBlock,
} from '@wordpress/blocks';
import { withFilters, withContext } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

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
import BlockContextualToolbar from './block-contextual-toolbar';
import BlockMultiControls from './multi-controls';
import {
	clearSelectedBlock,
	editPost,
	focusBlock,
	insertBlocks,
	mergeBlocks,
	removeBlock,
	replaceBlocks,
	selectBlock,
	startTyping,
	stopTyping,
	updateBlockAttributes,
	toggleSelection,
} from '../../actions';
import {
	getBlock,
	getBlockFocus,
	isMultiSelecting,
	getBlockIndex,
	getEditedPostAttribute,
	getNextBlock,
	getPreviousBlock,
	isBlockHovered,
	isBlockMultiSelected,
	isBlockSelected,
	isFirstMultiSelectedBlock,
	isSelectionEnabled,
	isTyping,
	getBlockMode,
} from '../../selectors';

const { BACKSPACE, ESCAPE, DELETE, ENTER, UP, RIGHT, DOWN, LEFT } = keycodes;

/**
 * Given a DOM node, finds the closest scrollable container node.
 *
 * @param  {Element}  node Node from which to start
 * @return {?Element}      Scrollable container node, if found
 */
function getScrollContainer( node ) {
	if ( ! node ) {
		return;
	}

	// Scrollable if scrollable height exceeds displayed...
	if ( node.scrollHeight > node.clientHeight ) {
		// ...except when overflow is defined to be hidden or visible
		const { overflowY } = window.getComputedStyle( node );
		if ( /(auto|scroll)/.test( overflowY ) ) {
			return node;
		}
	}

	// Continue traversing
	return getScrollContainer( node.parentNode );
}

export class BlockListBlock extends Component {
	constructor() {
		super( ...arguments );

		this.setBlockListRef = this.setBlockListRef.bind( this );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.maybeStartTyping = this.maybeStartTyping.bind( this );
		this.stopTypingOnMouseMove = this.stopTypingOnMouseMove.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onPointerDown = this.onPointerDown.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onBlockError = this.onBlockError.bind( this );
		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
		this.onTouchStart = this.onTouchStart.bind( this );
		this.onClick = this.onClick.bind( this );

		this.previousOffset = null;
		this.hadTouchStart = false;

		this.state = {
			error: null,
		};
	}

	componentDidMount() {
		if ( this.props.focus ) {
			this.node.focus();
		}

		if ( this.props.isTyping ) {
			document.addEventListener( 'mousemove', this.stopTypingOnMouseMove );
		}
	}

	componentWillReceiveProps( newProps ) {
		if (
			this.props.order !== newProps.order &&
			( ( this.props.isSelected && newProps.isSelected ) ||
			( this.props.isFirstMultiSelected && newProps.isFirstMultiSelected ) )
		) {
			this.previousOffset = this.node.getBoundingClientRect().top;
		}
	}

	componentDidUpdate( prevProps ) {
		// Preserve scroll prosition when block rearranged
		if ( this.previousOffset ) {
			const scrollContainer = getScrollContainer( this.node );
			if ( scrollContainer ) {
				scrollContainer.scrollTop = scrollContainer.scrollTop +
					this.node.getBoundingClientRect().top -
					this.previousOffset;
			}

			this.previousOffset = null;
		}

		// Focus node when focus state is programmatically transferred.
		if ( this.props.focus && ! prevProps.focus && ! this.node.contains( document.activeElement ) ) {
			this.node.focus();
		}

		// Bind or unbind mousemove from page when user starts or stops typing
		if ( this.props.isTyping !== prevProps.isTyping ) {
			if ( this.props.isTyping ) {
				document.addEventListener( 'mousemove', this.stopTypingOnMouseMove );
			} else {
				this.removeStopTypingListener();
			}
		}
	}

	componentWillUnmount() {
		this.removeStopTypingListener();
	}

	removeStopTypingListener() {
		document.removeEventListener( 'mousemove', this.stopTypingOnMouseMove );
	}

	setBlockListRef( node ) {
		this.props.blockRef( node, this.props.uid );
	}

	bindBlockNode( node ) {
		this.node = node;
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

	maybeHover() {
		const { isHovered, isSelected, isMultiSelected, onHover } = this.props;

		if ( isHovered || isSelected || isMultiSelected || this.hadTouchStart ) {
			return;
		}

		onHover();
	}

	maybeStartTyping() {
		// We do not want to dispatch start typing if...
		//  - State value already reflects that we're typing (dispatch noise)
		//  - The current block is not selected (e.g. after a split occurs,
		//    we'll still receive the keyDown event, but the focus has since
		//    shifted to the newly created block)
		if ( ! this.props.isTyping && this.props.isSelected ) {
			this.props.onStartTyping();
		}
	}

	stopTypingOnMouseMove( { clientX, clientY } ) {
		const { lastClientX, lastClientY } = this;

		// We need to check that the mouse really moved
		// Because Safari trigger mousemove event when we press shift, ctrl...
		if (
			lastClientX &&
			lastClientY &&
			( lastClientX !== clientX || lastClientY !== clientY )
		) {
			this.props.onStopTyping();
		}

		this.lastClientX = clientX;
		this.lastClientY = clientY;
	}

	mergeBlocks( forward = false ) {
		const { block, previousBlock, nextBlock, onMerge } = this.props;

		// Do nothing when it's the first block.
		if (
			( ! forward && ! previousBlock ) ||
			( forward && ! nextBlock )
		) {
			return;
		}

		if ( forward ) {
			onMerge( block, nextBlock );
		} else {
			onMerge( previousBlock, block );
		}
	}

	insertBlocksAfter( blocks ) {
		this.props.onInsertBlocks( blocks, this.props.order + 1 );
	}

	onFocus( event ) {
		if ( event.target === this.node ) {
			this.props.onSelect();
		}
	}

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
			this.props.onSelect();
		}
	}

	onKeyDown( event ) {
		const { keyCode, target } = event;

		switch ( keyCode ) {
			case ENTER:
				// Insert default block after current block if enter and event
				// not already handled by descendant.
				if ( target === this.node && ! this.props.isLocked ) {
					event.preventDefault();

					this.props.onInsertBlocks( [
						createBlock( 'core/paragraph' ),
					], this.props.order + 1 );
				}
				break;

			case UP:
			case RIGHT:
			case DOWN:
			case LEFT:
				// Arrow keys do not fire keypress event, but should still
				// trigger typing mode.
				this.maybeStartTyping();
				break;

			case BACKSPACE:
			case DELETE:
				// Remove block on backspace.
				if ( target === this.node ) {
					const { uid, onRemove, previousBlock, onFocus, isLocked } = this.props;
					event.preventDefault();
					if ( ! isLocked ) {
						onRemove( uid );

						if ( previousBlock ) {
							onFocus( previousBlock.uid, { offset: -1 } );
						}
					}
				}
				break;

			case ESCAPE:
				// Deselect on escape.
				this.props.onDeselect();
				break;
		}
	}

	onBlockError( error ) {
		this.setState( { error } );
	}

	render() {
		const { block, order, mode, showContextualToolbar, isLocked } = this.props;
		const { name: blockName, isValid } = block;
		const blockType = getBlockType( blockName );
		// translators: %s: Type of block (i.e. Text, Image etc)
		const blockLabel = sprintf( __( 'Block: %s' ), blockType.title );
		// The block as rendered in the editor is composed of general block UI
		// (mover, toolbar, wrapper) and the display of the block content.

		// Generate the wrapper class names handling the different states of the block.
		const { isHovered, isSelected, isMultiSelected, isFirstMultiSelected, focus } = this.props;
		const showUI = isSelected && ( ! this.props.isTyping || ( focus && focus.collapsed === false ) );
		const { error } = this.state;
		const wrapperClassName = classnames( 'editor-block-list__block', {
			'has-warning': ! isValid || !! error,
			'is-selected': showUI,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isHovered,
			'is-reusable': isReusableBlock( blockType ),
		} );

		const { onMouseLeave, onFocus, onReplace } = this.props;

		// Determine whether the block has props to apply to the wrapper.
		let wrapperProps;
		if ( blockType.getEditWrapperProps ) {
			wrapperProps = blockType.getEditWrapperProps( block.attributes );
		}

		// Generate a class name for the block's editable form
		const generatedClassName = hasBlockSupport( blockType, 'className', true ) ?
			getBlockDefaultClassname( block.name ) :
			null;
		const className = classnames( generatedClassName, block.attributes.className );

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				ref={ this.setBlockListRef }
				onMouseMove={ this.maybeHover }
				onMouseEnter={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ wrapperClassName }
				data-type={ block.name }
				onTouchStart={ this.onTouchStart }
				onClick={ this.onClick }
				{ ...wrapperProps }
			>
				<BlockDropZone index={ order } />
				{ ( showUI || isHovered ) && <BlockMover uids={ [ block.uid ] } /> }
				{ ( showUI || isHovered ) && <BlockSettingsMenu uids={ [ block.uid ] } /> }
				{ showUI && isValid && showContextualToolbar && <BlockContextualToolbar /> }
				{ isFirstMultiSelected && <BlockMultiControls /> }
				<div
					ref={ this.bindBlockNode }
					onKeyPress={ this.maybeStartTyping }
					onDragStart={ ( event ) => event.preventDefault() }
					onMouseDown={ this.onPointerDown }
					onKeyDown={ this.onKeyDown }
					onFocus={ this.onFocus }
					className={ BlockListBlock.className }
					tabIndex="0"
					aria-label={ blockLabel }
				>
					<BlockCrashBoundary onError={ this.onBlockError }>
						{ isValid && mode === 'visual' && (
							<BlockEdit
								name={ blockName }
								focus={ focus }
								attributes={ block.attributes }
								setAttributes={ this.setAttributes }
								insertBlocksAfter={ isLocked ? undefined : this.insertBlocksAfter }
								onReplace={ isLocked ? undefined : onReplace }
								setFocus={ partial( onFocus, block.uid ) }
								mergeBlocks={ isLocked ? undefined : this.mergeBlocks }
								id={ block.uid }
								isSelectionEnabled={ this.props.isSelectionEnabled }
								toggleSelection={ this.props.toggleSelection }
							/>
						) }
						{ isValid && mode === 'html' && (
							<BlockHtml uid={ block.uid } />
						) }
						{ ! isValid && [
							createElement( blockType.save, {
								key: 'invalid-preview',
								attributes: block.attributes,
								className,
							} ),
							<InvalidBlockWarning
								key="invalid-warning"
								block={ block }
							/>,
						] }
					</BlockCrashBoundary>
				</div>
				{ !! error && <BlockCrashWarning /> }
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

const mapStateToProps = ( state, { uid } ) => ( {
	previousBlock: getPreviousBlock( state, uid ),
	nextBlock: getNextBlock( state, uid ),
	block: getBlock( state, uid ),
	isSelected: isBlockSelected( state, uid ),
	isMultiSelected: isBlockMultiSelected( state, uid ),
	isFirstMultiSelected: isFirstMultiSelectedBlock( state, uid ),
	isHovered: isBlockHovered( state, uid ) && ! isMultiSelecting( state ),
	focus: getBlockFocus( state, uid ),
	isTyping: isTyping( state ),
	order: getBlockIndex( state, uid ),
	meta: getEditedPostAttribute( state, 'meta' ),
	mode: getBlockMode( state, uid ),
	isSelectionEnabled: isSelectionEnabled( state ),
} );

const mapDispatchToProps = ( dispatch, ownProps ) => ( {
	onChange( uid, attributes ) {
		dispatch( updateBlockAttributes( uid, attributes ) );
	},

	onSelect() {
		dispatch( selectBlock( ownProps.uid ) );
	},
	onDeselect() {
		dispatch( clearSelectedBlock() );
	},

	onStartTyping() {
		dispatch( startTyping() );
	},

	onStopTyping() {
		dispatch( stopTyping() );
	},

	onHover() {
		dispatch( {
			type: 'TOGGLE_BLOCK_HOVERED',
			hovered: true,
			uid: ownProps.uid,
		} );
	},
	onMouseLeave() {
		dispatch( {
			type: 'TOGGLE_BLOCK_HOVERED',
			hovered: false,
			uid: ownProps.uid,
		} );
	},

	onInsertBlocks( blocks, position ) {
		dispatch( insertBlocks( blocks, position ) );
	},

	onFocus( ...args ) {
		dispatch( focusBlock( ...args ) );
	},

	onRemove( uid ) {
		dispatch( removeBlock( uid ) );
	},

	onMerge( ...args ) {
		dispatch( mergeBlocks( ...args ) );
	},

	onReplace( blocks ) {
		dispatch( replaceBlocks( [ ownProps.uid ], blocks ) );
	},

	onMetaChange( meta ) {
		dispatch( editPost( { meta } ) );
	},
	toggleSelection( selectionEnabled ) {
		dispatch( toggleSelection( selectionEnabled ) );
	},
} );

BlockListBlock.className = 'editor-block-list__block-edit';

export default compose(
	connect( mapStateToProps, mapDispatchToProps ),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
	withFilters( 'editor.BlockListBlock' ),
)( BlockListBlock );
