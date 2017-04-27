/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Slot } from 'react-slot-fill';

/**
 * Internal dependencies
 */
import Toolbar from 'components/toolbar';
import BlockMover from 'components/block-mover';
import BlockSwitcher from 'components/block-switcher';

class VisualEditorBlock extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.bindBlockNode = this.bindBlockNode.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.maybeDeselect = this.maybeDeselect.bind( this );
		this.maybeHover = this.maybeHover.bind( this );
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
		onChange( {
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

	componentDidUpdate() {
		if ( this.previousOffset ) {
			window.scrollTo(
				window.scrollX,
				window.scrollY + this.node.getBoundingClientRect().top - this.previousOffset
			);
			this.previousOffset = null;
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

		const { onSelect, onStartTyping, onHover, onMouseLeave, onFocus, onInsertAfter } = this.props;

		// Determine whether the block has props to apply to the wrapper
		let wrapperProps;
		if ( settings.getEditWrapperProps ) {
			wrapperProps = settings.getEditWrapperProps( block.attributes );
		}

		// Disable reason: Each block can receive focus but must be able to contain
		// block children. Tab keyboard navigation enabled by tabIndex assignment.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.bindBlockNode }
				tabIndex="0"
				onFocus={ onSelect }
				onBlur={ this.maybeDeselect }
				onKeyDown={ onStartTyping }
				onMouseEnter={ onHover }
				onMouseMove={ this.maybeHover }
				onMouseLeave={ onMouseLeave }
				className={ className }
				data-type={ block.blockType }
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
				<BlockEdit
					focus={ focus }
					attributes={ block.attributes }
					setAttributes={ this.setAttributes }
					insertBlockAfter={ onInsertAfter }
					setFocus={ onFocus }
				/>
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions */
	}
}

export default connect(
	( state, ownProps ) => ( {
		order: state.blocks.order.indexOf( ownProps.uid ),
		block: state.blocks.byUid[ ownProps.uid ],
		isSelected: state.selectedBlock.uid === ownProps.uid,
		isHovered: state.hoveredBlock === ownProps.uid,
		focus: state.selectedBlock.uid === ownProps.uid ? state.selectedBlock.focus : null,
		isTyping: state.selectedBlock.uid === ownProps.uid ? state.selectedBlock.typing : false,
	} ),
	( dispatch, ownProps ) => ( {
		onChange( updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid: ownProps.uid,
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

		onFocus( config ) {
			dispatch( {
				type: 'UPDATE_FOCUS',
				uid: ownProps.uid,
				config
			} );
		}
	} )
)( VisualEditorBlock );
