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
import BlockMover from '../../components/block-mover';
import BlockSwitcher from '../../components/block-switcher';

class VisualEditorBlock extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeDeselect = this.maybeDeselect.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
		this.maybeStartTyping = this.maybeStartTyping.bind( this );
		this.removeOnBackspace = this.removeOnBackspace.bind( this );
		this.mergeWithPrevious = this.mergeWithPrevious.bind( this );
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
				...attributes
			}
		} );
	}

	maybeHover() {
		const { isTyping, isHovered, onHover } = this.props;
		if ( isTyping && ! isHovered ) {
			onHover();
		}
	}

	maybeDeselect( event ) {
		// Annoyingly React does not support focusOut and we're forced to check
		// related target to ensure it's not a child when blur fires.
		if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
			this.props.onDeselect();
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

	removeOnBackspace( event ) {
		const { keyCode, target } = event;
		if ( 8 /* Backspace */ === keyCode && target === this.node ) {
			this.props.onRemove( this.props.uid );
			if ( this.props.previousBlock ) {
				this.props.onFocus( this.props.previousBlock.uid, { offset: -1 } );
			}
		}
	}

	mergeWithPrevious() {
		const { block, previousBlock, onFocus, replaceBlocks } = this.props;

		// Do nothing when it's the first block
		if ( ! previousBlock ) {
			return;
		}

		const previousBlockSettings = wp.blocks.getBlockSettings( previousBlock.blockType );

		// Do nothing if the previous block is not mergeable
		if ( ! previousBlockSettings.merge ) {
			onFocus( previousBlock.uid );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType = previousBlock.blockType === block.blockType
			? [ block ]
			: wp.blocks.switchToBlockType( block, previousBlock.blockType );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = previousBlockSettings.merge( previousBlock.attributes, blocksWithTheSameType[ 0 ].attributes );

		onFocus( previousBlock.uid, { offset: -1 } );
		replaceBlocks(
			[ previousBlock.uid, block.uid ],
			[
				{
					...previousBlock,
					attributes: {
						...previousBlock.attributes,
						...updatedAttributes
					}
				},
				...blocksWithTheSameType.slice( 1 )
			]
		);
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
		const className = classnames( 'editor-visual-editor__block', {
			'is-selected': isSelected && ! isTyping,
			'is-hovered': isHovered
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
				onClick={ onSelect }
				onFocus={ onSelect }
				onBlur={ this.maybeDeselect }
				onKeyDown={ this.removeOnBackspace }
				onMouseEnter={ onHover }
				onMouseMove={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ className }
				data-type={ block.blockType }
				tabIndex="0"
				{ ...wrapperProps }
			>
				{ ( ( isSelected && ! isTyping ) || isHovered ) && <BlockMover uid={ block.uid } /> }
				{ isSelected && ! isTyping &&
					<div className="editor-visual-editor__block-controls">
						<BlockSwitcher uid={ block.uid } />
						{ !! settings.controls && (
							<Toolbar
								controls={ settings.controls.map( ( control ) => ( {
									...control,
									onClick: () => control.onClick( block.attributes, this.setAttributes ),
									isActive: control.isActive( block.attributes )
								} ) ) } />
						) }
						<Slot name="Formatting.Toolbar" />
					</div>
				}
				<div onKeyDown={ this.maybeStartTyping }>
					<BlockEdit
						focus={ focus }
						attributes={ block.attributes }
						setAttributes={ this.setAttributes }
						insertBlockAfter={ onInsertAfter }
						setFocus={ partial( onFocus, block.uid ) }
						mergeWithPrevious={ this.mergeWithPrevious }
					/>
				</div>
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	( state, ownProps ) => {
		const order = state.editor.blockOrder.indexOf( ownProps.uid );
		return {
			previousBlock: state.editor.blocksByUid[ state.editor.blockOrder[ order - 1 ] ] || null,
			block: state.editor.blocksByUid[ ownProps.uid ],
			isSelected: state.selectedBlock.uid === ownProps.uid,
			isHovered: state.hoveredBlock === ownProps.uid,
			focus: state.selectedBlock.uid === ownProps.uid ? state.selectedBlock.focus : null,
			isTyping: state.selectedBlock.uid === ownProps.uid ? state.selectedBlock.typing : false,
			order
		};
	},
	( dispatch, ownProps ) => ( {
		onChange( uid, updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid,
				updates
			} );
		},
		onSelect() {
			dispatch( {
				type: 'TOGGLE_BLOCK_SELECTED',
				selected: true,
				uid: ownProps.uid
			} );
		},
		onDeselect() {
			dispatch( {
				type: 'TOGGLE_BLOCK_SELECTED',
				selected: false,
				uid: ownProps.uid
			} );
		},
		onStartTyping() {
			dispatch( {
				type: 'START_TYPING',
				uid: ownProps.uid
			} );
		},
		onHover() {
			dispatch( {
				type: 'TOGGLE_BLOCK_HOVERED',
				hovered: true,
				uid: ownProps.uid
			} );
		},
		onMouseLeave() {
			dispatch( {
				type: 'TOGGLE_BLOCK_HOVERED',
				hovered: false,
				uid: ownProps.uid
			} );
		},

		onInsertAfter( block ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				after: ownProps.uid,
				block
			} );
		},

		onFocus( uid, config ) {
			dispatch( {
				type: 'UPDATE_FOCUS',
				uid,
				config
			} );
		},

		onRemove( uid ) {
			dispatch( {
				type: 'REMOVE_BLOCK',
				uid
			} );
		},

		replaceBlocks( uids, blocks ) {
			dispatch( {
				type: 'REPLACE_BLOCKS',
				uids,
				blocks
			} );
		}
	} )
)( VisualEditorBlock );
