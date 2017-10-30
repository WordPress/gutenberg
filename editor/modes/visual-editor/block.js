/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { has, partial, reduce, size } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, createElement } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';
import { getBlockType, getBlockDefaultClassname, createBlock } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InvalidBlockWarning from './invalid-block-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockDropZone from './block-drop-zone';
import BlockHtml from './block-html';
import BlockMover from '../../block-mover';
import BlockSettingsMenu from '../../block-settings-menu';
import BlockToolbar from '../../block-toolbar';
import {
	clearSelectedBlock,
	editPost,
	focusBlock,
	focusBlockEdit,
	insertBlocks,
	mergeBlocks,
	removeBlocks,
	replaceBlocks,
	selectBlock,
	startTyping,
	stopTyping,
	updateBlockAttributes,
} from '../../actions';
import {
	getBlock,
	getBlockFocus,
	isMultiSelecting,
	getBlockIndex,
	getEditedPostAttribute,
	getMultiSelectedBlockUids,
	getNextBlock,
	getPreviousBlock,
	isBlockHovered,
	isBlockMultiSelected,
	isBlockSelected,
	isFirstMultiSelectedBlock,
	isTyping,
	getBlockMode,
} from '../../selectors';

const { BACKSPACE, ESCAPE, DELETE, ENTER, UP, RIGHT, DOWN, LEFT } = keycodes;

class VisualEditorBlock extends Component {
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

		this.previousOffset = null;

		this.state = {
			error: null,
		};
	}

	componentDidMount() {
		if ( this.props.focus && this.props.focus.target === 'block' ) {
			this.node.focus();
		}

		if ( this.props.isTyping ) {
			document.addEventListener( 'mousemove', this.stopTypingOnMouseMove );
		}

		// Not Ideal, but it's the easiest way to get the scrollable container
		this.editorLayout = document.querySelector( '.editor-layout__editor' );
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
			this.editorLayout.scrollTop = this.editorLayout.scrollTop +
				this.node.getBoundingClientRect().top -
				this.previousOffset;
			this.previousOffset = null;
		}

		// Focus node when focus state is programmatically transferred.
		if ( this.props.focus !== prevProps.focus && this.props.focus && this.props.focus.target === 'block' ) {
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
			if ( type && has( type, [ 'attributes', key, 'meta' ] ) ) {
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

	maybeHover() {
		const { isHovered, isSelected, isMultiSelected, onHover } = this.props;

		if ( isHovered || isSelected || isMultiSelected ) {
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
		const { onFocusBlock } = this.props;
		if ( event.target === this.node ) {
			onFocusBlock( this.props.uid );
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
		const { uid, onRemove, previousBlock, nextBlock, onFocusBlockEdit, onFocusBlock } = this.props;

		const { keyCode, target } = event;

		const focusOnContainer = target === this.node;

		switch ( keyCode ) {
			case ENTER:
				// Insert default block after current block if enter and event
				// not already handled by descendant.
				if ( focusOnContainer ) {
					event.preventDefault();
					event.stopPropagation();
					onFocusBlockEdit( this.props.uid );
				}
				break;

			case UP:
				if ( focusOnContainer && previousBlock ) {
					event.preventDefault();
					event.stopPropagation();
					onFocusBlock( previousBlock.uid );
				}
				break;
			case DOWN:
				if ( focusOnContainer && nextBlock ) {
					event.preventDefault();
					event.stopPropagation();
					onFocusBlock( nextBlock.uid );
				}
				break;
			case RIGHT:
			case LEFT:
				// Arrow keys do not fire keypress event, but should still
				// trigger typing mode.
				this.maybeStartTyping();
				break;

			case BACKSPACE:
			case DELETE:
				// Remove block on backspace.
				if ( focusOnContainer ) {
					event.preventDefault();
					onRemove( uid );

					if ( previousBlock ) {
						onFocusBlockEdit( previousBlock.uid, { offset: -1 } );
					}
				}
				break;

			case ESCAPE:
				if ( ! focusOnContainer ) {
					onFocusBlock( this.props.uid );
				}
				break;
		}
	}

	onBlockError( error ) {
		this.setState( { error } );
	}

	render() {
		const { block, multiSelectedBlockUids, order, mode } = this.props;
		const { name: blockName, isValid } = block;
		const blockType = getBlockType( blockName );
		// translators: %s: Type of block (i.e. Text, Image etc)
		const blockLabel = sprintf( __( 'Block: %s' ), blockType.title );
		// The block as rendered in the editor is composed of general block UI
		// (mover, toolbar, wrapper) and the display of the block content, which
		// is referred to as <BlockEdit />.
		let BlockEdit;
		// `edit` and `save` are functions or components describing the markup
		// with which a block is displayed. If `blockType` is valid, assign
		// them preferencially as the render value for the block.
		if ( blockType ) {
			BlockEdit = blockType.edit || blockType.save;
		}

		// Should `BlockEdit` return as null, we have nothing to display for the block.
		if ( ! BlockEdit ) {
			return null;
		}

		// Generate the wrapper class names handling the different states of the block.
		const { isHovered, isSelected, isMultiSelected, isFirstMultiSelected, focus } = this.props;

		const isNavigating = focus && focus.target === 'block';

		// Ignoring focus collapsed ... probably want to add that.
		const showUI = isSelected && ( ! this.props.isTyping && focus && focus.target === 'blockEdit' );
		const isProperlyHovered = isHovered && ! this.props.isSelecting;
		const { error } = this.state;
		const wrapperClassName = classnames( 'editor-visual-editor__block', {
			'has-warning': ! isValid || !! error,
			'is-selected': isSelected && ! isNavigating,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isProperlyHovered,
			'is-navigating': isNavigating,
		} );

		const { onMouseLeave, onFocusBlockEdit, onReplace } = this.props;

		// Determine whether the block has props to apply to the wrapper.
		let wrapperProps;
		if ( blockType.getEditWrapperProps ) {
			wrapperProps = blockType.getEditWrapperProps( block.attributes );
		}

		// Generate a class name for the block's editable form
		let { className = getBlockDefaultClassname( block.name ) } = blockType;
		className = classnames( className, block.attributes.className );

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
				{ ...wrapperProps }
			>
				<BlockDropZone index={ order } />
				{ ( showUI || isProperlyHovered ) && <BlockMover uids={ [ block.uid ] } /> }
				{ ( showUI || isProperlyHovered ) && <BlockSettingsMenu uids={ [ block.uid ] } /> }
				{ isSelected && isValid && <BlockToolbar uid={ block.uid } /> }
				{ isFirstMultiSelected && ! this.props.isSelecting &&
					<BlockMover uids={ multiSelectedBlockUids } />
				}
				{ isFirstMultiSelected && ! this.props.isSelecting &&
					<BlockSettingsMenu uids={ multiSelectedBlockUids } />
				}
				<div
					ref={ this.bindBlockNode }
					onKeyPress={ this.maybeStartTyping }
					onDragStart={ ( event ) => event.preventDefault() }
					onMouseDown={ this.onPointerDown }
					onKeyDown={ this.onKeyDown }
					onFocus={ this.onFocus }
					className="editor-visual-editor__block-edit"
					tabIndex="0"
					aria-label={ blockLabel }
				>
					<BlockCrashBoundary onError={ this.onBlockError }>
						{ isValid && mode === 'visual' && (
							<BlockEdit
								focus={ focus && focus.target === 'blockEdit' ? focus.options : null }
								attributes={ block.attributes }
								setAttributes={ this.setAttributes }
								insertBlocksAfter={ this.insertBlocksAfter }
								onReplace={ onReplace }
								setFocus={ partial( onFocusBlockEdit, block.uid ) }
								mergeBlocks={ this.mergeBlocks }
								className={ className }
								id={ block.uid }
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

export default connect(
	( state, ownProps ) => {
		return {
			previousBlock: getPreviousBlock( state, ownProps.uid ),
			nextBlock: getNextBlock( state, ownProps.uid ),
			block: getBlock( state, ownProps.uid ),
			isSelected: isBlockSelected( state, ownProps.uid ),
			isMultiSelected: isBlockMultiSelected( state, ownProps.uid ),
			isFirstMultiSelected: isFirstMultiSelectedBlock( state, ownProps.uid ),
			isHovered: isBlockHovered( state, ownProps.uid ),
			focus: getBlockFocus( state, ownProps.uid ),
			isSelecting: isMultiSelecting( state ),
			isTyping: isTyping( state ),
			order: getBlockIndex( state, ownProps.uid ),
			multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
			meta: getEditedPostAttribute( state, 'meta' ),
			mode: getBlockMode( state, ownProps.uid ),
		};
	},
	( dispatch, ownProps ) => ( {
		onChange( uid, attributes ) {
			dispatch( updateBlockAttributes( uid, attributes ) );
		},

		onFocusBlock( uid ) {
			dispatch( focusBlock( uid ) );
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

		onFocusBlockEdit( uid, config ) {
			dispatch( focusBlockEdit( uid, config ) );
		},

		onRemove( uids ) {
			dispatch( removeBlocks( uids ) );
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
	} )
)( VisualEditorBlock );
