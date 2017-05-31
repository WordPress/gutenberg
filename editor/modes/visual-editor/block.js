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
import { Toolbar, ToolbarMenu } from 'components';
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
} from '../../actions';
import {
	getPreviousBlock,
	getNextBlock,
	getBlock,
	getBlockFocus,
	getBlockOrder,
	isBlockHovered,
	isBlockSelected,
	isBlockMultiSelected,
	isFirstSelectedBlock,
	getSelectedBlocks,
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
		this.selectAndStopPropagation = this.selectAndStopPropagation.bind( this );
		this.previousOffset = null;
	}

	bindBlockNode( node ) {
		this.node = node;
	}

	componentWillReceiveProps( newProps ) {
		if (
			this.props.order !== newProps.order &&
			( ( this.props.isSelected && newProps.isSelected ) ||
			( this.props.isFirstSelected && newProps.isFirstSelected ) )
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
			selectedBlocks,
			previousBlock,
			onRemove,
			onFocus,
			onDeselect,
		} = this.props;

		// Remove block on backspace
		if ( BACKSPACE === keyCode ) {
			if ( target === this.node ) {
				onRemove( [ uid ] );

				if ( previousBlock ) {
					onFocus( previousBlock.uid, { offset: -1 } );
				}
			}

			if ( selectedBlocks.length ) {
				onRemove( selectedBlocks );
			}
		}

		// Deselect on escape
		if ( ESCAPE === keyCode ) {
			onDeselect();
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
		const { block, selectedBlocks } = this.props;
		const settings = wp.blocks.getBlockSettings( block.blockType );

		let BlockEdit;
		if ( settings ) {
			BlockEdit = settings.edit || settings.save;
		}

		if ( ! BlockEdit ) {
			return null;
		}

		const { isHovered, isSelected, isMultiSelected, isFirstSelected, isTyping, focus } = this.props;
		const showUI = isSelected && ( ! isTyping || ! focus.collapsed );
		const className = classnames( 'editor-visual-editor__block', {
			'is-selected': showUI,
			'is-multi-selected': isMultiSelected,
			'is-hovered': isHovered,
		} );

		const { onSelect, onMouseLeave, onFocus, onInsertAfter } = this.props;

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
				onKeyDown={ this.removeOrDeselect }
				onMouseDown={ this.props.onSelectionStart }
				onTouchStart={ this.props.onSelectionStart }
				onMouseMove={ () => {
					this.props.onSelectionChange();
					this.maybeHover();
				} }
				onTouchMove={ this.props.onSelectionChange }
				onMouseUp={ this.props.onSelectionEnd }
				onTouchEnd={ this.props.onSelectionEnd }
				onMouseEnter={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ className }
				data-type={ block.blockType }
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
							{ !! settings.controls && (
								<Toolbar
									controls={ settings.controls.map( ( control ) => ( {
										...control,
										onClick: () => control.onClick( block.attributes, this.setAttributes ),
										isActive: control.isActive ? control.isActive( block.attributes ) : false,
									} ) ) } />
							) }
							<Slot name="Formatting.Toolbar" />
							{ !! settings.advControls && (
								<ToolbarMenu
									icon={ settings.advIcon }
									controls={ settings.advControls.map( ( control ) => ( {
										...control,
										onClick: () => control.onClick( block.attributes, this.setAttributes ),
									} ) ) } />
							) }
						</div>
					</CSSTransitionGroup>
				}
				{ isFirstSelected && (
					<BlockMover uids={ selectedBlocks } />
				) }
				{ isFirstSelected && (
					<div className="editor-visual-editor__block-controls">
						<Toolbar
							controls={ [ {
								icon: 'trash',
								title: '',
								onClick: () => this.props.onRemove( selectedBlocks ),
								isActive: false,
							} ] }
							focus={ true }
						/>
					</div>
				) }
				<div
					onKeyPress={ this.maybeStartTyping }
					onFocus={ onSelect }
					onClick={ this.selectAndStopPropagation }
				>
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
			isMultiSelected: isBlockMultiSelected( state, ownProps.uid ),
			isFirstSelected: isFirstSelectedBlock( state, ownProps.uid ),
			selectedBlocks: getSelectedBlocks( state ),
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
			dispatch( { type: 'CLEAR_SELECTED_BLOCK' } );
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
