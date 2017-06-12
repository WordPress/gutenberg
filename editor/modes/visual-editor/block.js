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
import { Children } from 'element';
import { Toolbar } from 'components';
import { BACKSPACE, ESCAPE } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import BlockMover from '../../block-mover';
import BlockSwitcher from '../../block-switcher';
import {
	focusBlock,
	mergeBlocks,
	insertBlock,
	clearSelectedBlock,
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
	isTypingInBlock,
} from '../../selectors';

function FirstChild( { children } ) {
	const childrenArray = Children.toArray( children );
	return childrenArray[ 0 ] || null;
}

class VisualEditorBlock extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.maybeStartTyping = this.maybeStartTyping.bind( this );
		this.removeOrDeselect = this.removeOrDeselect.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onPointerDown = this.onPointerDown.bind( this );
		this.onPointerMove = this.onPointerMove.bind( this );
		this.onPointerUp = this.onPointerUp.bind( this );
		this.previousOffset = null;
	}

	bindBlockNode( node ) {
		this.node = node;
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

	setAttributes( attributes ) {
		const { block, onChange } = this.props;
		onChange( block.uid, {
			attributes: {
				...block.attributes,
				...attributes,
			},
		} );
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
		const { isTyping, isSelected, onStartTyping } = this.props;
		if ( ! isTyping && isSelected ) {
			onStartTyping();
		}
	}

	removeOrDeselect( { keyCode, target } ) {
		const {
			uid,
			multiSelectedBlockUids,
			previousBlock,
			onRemove,
			onFocus,
			onDeselect,
		} = this.props;

		// Remove block on backspace.
		if ( BACKSPACE === keyCode ) {
			if ( target === this.node ) {
				onRemove( [ uid ] );

				if ( previousBlock ) {
					onFocus( previousBlock.uid, { offset: -1 } );
				}
			}

			if ( multiSelectedBlockUids.length ) {
				onRemove( multiSelectedBlockUids );
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

	componentDidUpdate( prevProps ) {
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
	}

	componentDidMount() {
		if ( this.props.focus ) {
			this.node.focus();
		}
	}

	onFocus( event ) {
		if ( event.target === this.node ) {
			this.props.onSelect();
		}
	}

	onPointerDown() {
		this.props.onSelectionStart();
	}

	onPointerMove() {
		this.props.onSelectionChange();
		this.maybeHover();
	}

	onPointerUp() {
		this.props.onSelectionEnd();
	}

	render() {
		const { block, multiSelectedBlockUids } = this.props;
		const blockType = wp.blocks.getBlockType( block.name );
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
		const { isHovered, isSelected, isMultiSelected, isFirstMultiSelected, isTyping, focus } = this.props;
		const showUI = isSelected && ( ! isTyping || ! focus.collapsed );
		const className = classnames( 'editor-visual-editor__block', {
			'is-selected': showUI,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isHovered,
		} );

		const { onMouseLeave, onFocus, onInsertAfter } = this.props;

		// Determine whether the block has props to apply to the wrapper.
		let wrapperProps;
		if ( blockType.getEditWrapperProps ) {
			wrapperProps = blockType.getEditWrapperProps( block.attributes );
		}

		// Disable reason: Each block can be selected by clicking on it
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				ref={ this.bindBlockNode }
				onKeyDown={ this.removeOrDeselect }
				onFocus={ this.onFocus }
				onMouseDown={ this.onPointerDown }
				onTouchStart={ this.onPointerDown }
				onMouseMove={ this.onPointerMove }
				onTouchMove={ this.onPointerMove }
				onMouseUp={ this.onPointerUp }
				onTouchEnd={ this.onPointerUp }
				onMouseEnter={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ className }
				data-type={ block.name }
				tabIndex="0"
				{ ...wrapperProps }
			>
				{ ( showUI || isHovered ) && <BlockMover uids={ [ block.uid ] } /> }
				{ showUI &&
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
							{ !! blockType.controls && (
								<Toolbar
									controls={ blockType.controls.map( ( control ) => ( {
										...control,
										onClick: () => control.onClick( block.attributes, this.setAttributes ),
										isActive: control.isActive ? control.isActive( block.attributes ) : false,
									} ) ) } />
							) }
							<Slot name="Formatting.Toolbar" />
						</div>
					</CSSTransitionGroup>
				}
				{ isFirstMultiSelected && (
					<BlockMover uids={ multiSelectedBlockUids } />
				) }
				<div
					onKeyPress={ this.maybeStartTyping }
					onDragStart={ ( event ) => event.preventDefault() }
					onMouseDown={ this.props.onSelect }
				>
					<BlockEdit
						focus={ focus }
						attributes={ block.attributes }
						setAttributes={ this.setAttributes }
						insertBlockAfter={ onInsertAfter }
						setFocus={ partial( onFocus, block.uid ) }
						mergeBlocks={ this.mergeBlocks }
						id={ block.uid }
					/>
				</div>
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
			isTyping: isTypingInBlock( state, ownProps.uid ),
			order: getBlockIndex( state, ownProps.uid ),
		};
	},
	( dispatch, ownProps ) => ( {
		onChange( uid, updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid,
				updates,
			} );
		},
		onSelect() {
			dispatch( {
				type: 'TOGGLE_BLOCK_SELECTED',
				selected: true,
				uid: ownProps.uid,
			} );
		},
		onDeselect() {
			dispatch( clearSelectedBlock() );
		},
		onStartTyping() {
			dispatch( {
				type: 'START_TYPING',
				uid: ownProps.uid,
			} );
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

		onInsertAfter( block ) {
			dispatch( insertBlock( block, ownProps.uid ) );
		},

		onFocus( ...args ) {
			dispatch( focusBlock( ...args ) );
		},

		onRemove( uids ) {
			dispatch( {
				type: 'REMOVE_BLOCKS',
				uids,
			} );
		},

		onMerge( ...args ) {
			dispatch( mergeBlocks( ...args ) );
		},
	} )
)( VisualEditorBlock );
