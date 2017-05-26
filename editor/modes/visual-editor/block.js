/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Slot } from 'react-slot-fill';
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import Toolbar from 'components/toolbar';

/**
 * Internal dependencies
 */
import BlockMover from '../../block-mover';
import BlockSwitcher from '../../block-switcher';
import {
	deselectBlock,
	focusBlock,
	mergeBlocks,
	insertBlock,
} from '../../actions';
import {
	getPreviousBlock,
	getNextBlock,
	getBlock,
	getBlockFocus,
	getBlockOrder,
	isBlockHovered,
	isBlockSelected,
	isTypingInBlock,
} from '../../selectors';

class VisualEditorBlock extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.maybeStartTyping = this.maybeStartTyping.bind( this );
		this.removeOrDeselect = this.removeOrDeselect.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.selectAndStopPropagation = this.selectAndStopPropagation.bind( this );
		this.previousOffset = null;
	}

	bindBlockNode( node ) {
		this.node = node;
	}

	componentWillReceiveProps( newProps ) {
		if (
			this.props.order !== newProps.order &&
			this.props.isSelected &&
			newProps.isSelected
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
		const { isTyping, isHovered, onHover } = this.props;
		if ( isTyping && ! isHovered ) {
			onHover();
		}
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

	removeOrDeselect( event ) {
		const { keyCode, target } = event;

		// Remove block on backspace
		if ( 8 /* Backspace */ === keyCode && target === this.node ) {
			this.props.onRemove( this.props.uid );
			if ( this.props.previousBlock ) {
				this.props.onFocus( this.props.previousBlock.uid, { offset: -1 } );
			}
		}

		// Deselect on escape
		if ( 27 /* Escape */ === event.keyCode ) {
			this.props.onDeselect();
		}
	}

	mergeBlocks( forward = false ) {
		const { block, previousBlock, nextBlock, onMerge } = this.props;

		// Do nothing when it's the first block
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

	selectAndStopPropagation( event ) {
		this.props.onSelect();

		// Visual editor infers click as intent to clear the selected block, so
		// prevent bubbling when occurring on block where selection is intended
		event.stopPropagation();
	}

	componentDidUpdate( prevProps ) {
		if ( this.previousOffset ) {
			window.scrollTo(
				window.scrollX,
				window.scrollY + this.node.getBoundingClientRect().top - this.previousOffset
			);
			this.previousOffset = null;
		}

		// Focus node when focus state is programmatically transferred
		if ( this.props.focus && ! prevProps.focus ) {
			this.node.focus();
		}
	}

	componentDidMount() {
		if ( this.props.focus ) {
			this.node.focus();
		}
	}

	render() {
		const { block } = this.props;
		const settings = wp.blocks.getBlockSettings( block.blockType );

		let BlockEdit;
		if ( settings ) {
			BlockEdit = settings.edit || settings.save;
		}

		if ( ! BlockEdit ) {
			return null;
		}

		const { isHovered, isSelected, isTyping, focus } = this.props;
		const showUI = isSelected && ( ! isTyping || ! focus.collapsed );
		const className = classnames( 'editor-visual-editor__block', {
			'is-selected': showUI,
			'is-hovered': isHovered,
		} );

		const { onSelect, onHover, onMouseLeave, onFocus, onInsertAfter } = this.props;

		// Determine whether the block has props to apply to the wrapper
		let wrapperProps;
		if ( settings.getEditWrapperProps ) {
			wrapperProps = settings.getEditWrapperProps( block.attributes );
		}

		// Disable reason: Each block can be selected by clicking on it

		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				ref={ this.bindBlockNode }
				onClick={ this.selectAndStopPropagation }
				onFocus={ onSelect }
				onKeyDown={ this.removeOrDeselect }
				onMouseEnter={ onHover }
				onMouseMove={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ className }
				data-type={ block.blockType }
				tabIndex="0"
				{ ...wrapperProps }
			>
				{ ( showUI || isHovered ) && <BlockMover uid={ block.uid } /> }
				{ showUI &&
					<div className="editor-visual-editor__block-controls">
						<BlockSwitcher uid={ block.uid } />
						{ !! settings.controls && (
							<Toolbar
								controls={ settings.controls.map( ( control ) => ( {
									...control,
									onClick: () => control.onClick( block.attributes, this.setAttributes ),
									isActive: control.isActive ? control.isActive( block.attributes ) : false,
								} ) ) } />
						) }
						<Slot name="Formatting.Toolbar" />
					</div>
				}
				<div onKeyPress={ this.maybeStartTyping }>
					<BlockEdit
						focus={ focus }
						attributes={ block.attributes }
						setAttributes={ this.setAttributes }
						insertBlockAfter={ onInsertAfter }
						setFocus={ partial( onFocus, block.uid ) }
						mergeBlocks={ this.mergeBlocks }
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
			isHovered: isBlockHovered( state, ownProps.uid ),
			focus: getBlockFocus( state, ownProps.uid ),
			isTyping: isTypingInBlock( state, ownProps.uid ),
			order: getBlockOrder( state, ownProps.uid ),
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
			dispatch( deselectBlock( ownProps.uid ) );
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

		onRemove( uid ) {
			dispatch( {
				type: 'REMOVE_BLOCK',
				uid,
			} );
		},

		onMerge( ...args ) {
			dispatch( mergeBlocks( ...args ) );
		},
	} )
)( VisualEditorBlock );
