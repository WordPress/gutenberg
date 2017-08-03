/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Slot } from 'react-slot-fill';
import { partial } from 'lodash';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

/**
 * WordPress dependencies
 */
import { Children, Component } from '@wordpress/element';
import { IconButton, Toolbar } from '@wordpress/components';
import { keycodes } from '@wordpress/utils';
import { getBlockType, getBlockDefaultClassname, createBlock } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InvalidBlockWarning from './invalid-block-warning';
import BlockCrashWarning from './block-crash-warning';
import BlockCrashBoundary from './block-crash-boundary';
import BlockMover from '../../block-mover';
import BlockRightMenu from '../../block-settings-menu';
import BlockSwitcher from '../../block-switcher';
import {
	updateBlockAttributes,
	focusBlock,
	mergeBlocks,
	insertBlocks,
	removeBlocks,
	clearSelectedBlock,
	startTyping,
	stopTyping,
	replaceBlocks,
	selectBlock,
} from '../../actions';
import {
	getPreviousBlock,
	getNextBlock,
	getBlock,
	getBlockFocus,
	getBlockIndex,
	isBlockHovered,
	isBlockSelected,
	isBlockMultiSelected,
	isFirstMultiSelectedBlock,
	isTyping,
	getMultiSelectedBlockUids,
} from '../../selectors';

const { BACKSPACE, ESCAPE, DELETE, UP, DOWN, LEFT, RIGHT, ENTER } = keycodes;

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

class VisualEditorBlock extends Component {
	constructor() {
		super( ...arguments );

		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.maybeStartTyping = this.maybeStartTyping.bind( this );
		this.stopTypingOnMouseMove = this.stopTypingOnMouseMove.bind( this );
		this.removeOrDeselect = this.removeOrDeselect.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onPointerDown = this.onPointerDown.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.handleArrowKey = this.handleArrowKey.bind( this );
		this.toggleMobileControls = this.toggleMobileControls.bind( this );
		this.onBlockError = this.onBlockError.bind( this );

		this.previousOffset = null;

		this.state = {
			showMobileControls: false,
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
			window.scrollTo(
				window.scrollX,
				window.scrollY + this.node.getBoundingClientRect().top - this.previousOffset
			);
			this.previousOffset = null;
		}

		// Focus node when focus state is programmatically transferred.
		if ( this.props.focus && ! prevProps.focus ) {
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

	bindBlockNode( node ) {
		this.node = node;
		this.props.blockRef( node );
	}

	setAttributes( attributes ) {
		const { block, onChange } = this.props;
		onChange( block.uid, attributes );
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

	removeOrDeselect( event ) {
		const { keyCode, target } = event;
		const {
			uid,
			previousBlock,
			onRemove,
			onFocus,
			onDeselect,
		} = this.props;

		// Remove block on backspace.
		if (
			target === this.node &&
			( BACKSPACE === keyCode || DELETE === keyCode )
		) {
			event.preventDefault();
			onRemove( [ uid ] );

			if ( previousBlock ) {
				onFocus( previousBlock.uid, { offset: -1 } );
			}
		}

		// Deselect on escape.
		if ( ESCAPE === keyCode ) {
			onDeselect();
		}
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

	onFocus( event ) {
		if ( event.target === this.node ) {
			this.props.onSelect();
		}
	}

	onPointerDown( event ) {
		// Not the main button (usually the left button on pointer device).
		if ( event.buttons !== 1 ) {
			return;
		}

		this.props.onSelectionStart();
		this.props.onSelect();
	}

	onKeyDown( event ) {
		const { keyCode, target } = event;

		this.handleArrowKey( event );

		if ( keyCode === UP || keyCode === LEFT || keyCode === DOWN || keyCode === RIGHT ) {
			const selection = window.getSelection();
			this.lastRange = selection.rangeCount ? selection.getRangeAt( 0 ) : null;
		}

		if ( ENTER === keyCode && target === this.node ) {
			event.preventDefault();

			this.props.onInsertBlocksAfter( [
				createBlock( 'core/paragraph' ),
			] );
		}
	}

	onKeyUp( event ) {
		this.removeOrDeselect( event );
		this.handleArrowKey( event );
	}

	handleArrowKey( event ) {
		const { keyCode, target } = event;
		const moveUp = ( keyCode === UP || keyCode === LEFT );
		const moveDown = ( keyCode === DOWN || keyCode === RIGHT );
		const wrapperClassname = '.editor-visual-editor';
		const selectors = [
			'*[contenteditable="true"]',
			'*[tabindex]',
			'textarea',
			'input',
		].map( ( selector ) => `${ wrapperClassname } ${ selector }` ).join( ',' );

		if ( moveUp || moveDown ) {
			const selection = window.getSelection();
			const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;

			// If there's no movement, so we're either at the end of start, or
			// no text input at all.
			if ( range !== this.lastRange ) {
				return;
			}

			const focusableNodes = Array.from( document.querySelectorAll( selectors ) );

			if ( moveUp ) {
				focusableNodes.reverse();
			}

			const targetNode = focusableNodes
				.slice( focusableNodes.indexOf( target ) )
				.reduce( ( result, node ) => {
					return result || ( node.contains( target ) ? null : node );
				}, null );

			if ( targetNode ) {
				targetNode.focus();
			}
		}

		delete this.lastRange;
	}

	toggleMobileControls() {
		this.setState( {
			showMobileControls: ! this.state.showMobileControls,
		} );
	}

	onBlockError( error ) {
		this.setState( { error } );
	}

	render() {
		const { block, multiSelectedBlockUids } = this.props;
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
		const showUI = isSelected && ( ! this.props.isTyping || focus.collapsed === false );
		const { error, showMobileControls } = this.state;
		const wrapperClassname = classnames( 'editor-visual-editor__block', {
			'has-warning': ! isValid || !! error,
			'is-selected': showUI,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isHovered,
			'is-showing-mobile-controls': showMobileControls,
		} );

		const { onMouseLeave, onFocus, onInsertBlocksAfter, onReplace } = this.props;

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
				ref={ this.bindBlockNode }
				onKeyDown={ this.onKeyDown }
				onKeyUp={ this.onKeyUp }
				onFocus={ this.onFocus }
				onMouseMove={ this.maybeHover }
				onMouseEnter={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ wrapperClassname }
				data-type={ block.name }
				tabIndex="0"
				aria-label={ blockLabel }
				{ ...wrapperProps }
			>
				{ ( showUI || isHovered ) && <BlockMover uids={ [ block.uid ] } /> }
				{ ( showUI || isHovered ) && <BlockRightMenu uid={ block.uid } /> }
				{ showUI && isValid &&
					<CSSTransitionGroup
						transitionName={ { appear: 'is-appearing', appearActive: 'is-appearing-active' } }
						transitionAppear={ true }
						transitionAppearTimeout={ 100 }
						transitionEnter={ false }
						transitionLeave={ false }
						component={ FirstChild }
					>
						<div className="editor-visual-editor__block-controls">
							<BlockSwitcher uid={ block.uid } />
							<Slot name="Formatting.Toolbar" />
							<Toolbar className="editor-visual-editor__mobile-tools">
								{ ( showUI || isHovered ) && <BlockMover uids={ [ block.uid ] } /> }
								{ ( showUI || isHovered ) && <BlockRightMenu uid={ block.uid } /> }
								<IconButton
									className="editor-visual-editor__mobile-toggle"
									onClick={ this.toggleMobileControls }
									aria-expanded={ showMobileControls }
									label={ __( 'Toggle extra controls' ) }
									icon="ellipsis"
								/>
							</Toolbar>
						</div>
					</CSSTransitionGroup>
				}
				{ isFirstMultiSelected && (
					<BlockMover uids={ multiSelectedBlockUids } />
				) }
				<div
					onKeyPress={ this.maybeStartTyping }
					onDragStart={ ( event ) => event.preventDefault() }
					onMouseDown={ this.onPointerDown }
					onTouchStart={ this.onPointerDown }
					className="editor-visual-editor__block-edit"
				>
					{ isValid && ! error && (
						<BlockCrashBoundary onError={ this.onBlockError }>
							<BlockEdit
								focus={ focus }
								attributes={ block.attributes }
								setAttributes={ this.setAttributes }
								insertBlocksAfter={ onInsertBlocksAfter }
								onReplace={ onReplace }
								setFocus={ partial( onFocus, block.uid ) }
								mergeBlocks={ this.mergeBlocks }
								className={ className }
								id={ block.uid }
							/>
						</BlockCrashBoundary>
					) }
					{ ! isValid && (
						blockType.save( {
							attributes: block.attributes,
							className,
						} )
					) }
				</div>
				{ !! error && <BlockCrashWarning /> }
				{ ! isValid && <InvalidBlockWarning block={ block } /> }
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
			isTyping: isTyping( state ),
			order: getBlockIndex( state, ownProps.uid ),
			multiSelectedBlockUids: getMultiSelectedBlockUids( state ),
		};
	},
	( dispatch, ownProps ) => ( {
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

		onInsertBlocksAfter( blocks ) {
			dispatch( insertBlocks( blocks, ownProps.uid ) );
		},

		onFocus( ...args ) {
			dispatch( focusBlock( ...args ) );
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
	} )
)( VisualEditorBlock );
