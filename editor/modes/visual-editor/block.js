/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

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

		const { isHovered, isSelected } = this.props;
		const className = classnames( 'editor-visual-editor__block', {
			'is-selected': isSelected,
			'is-hovered': isHovered
		} );

		const { onSelect, onDeselect, onMouseEnter, onMouseLeave, onInsertAfter } = this.props;

		// Disable reason: Each block can receive focus but must be able to contain
		// block children. Tab keyboard navigation enabled by tabIndex assignment.

		/* eslint-disable jsx-a11y/no-static-element-interactions */
		return (
			<div
				ref={ this.bindBlockNode }
				tabIndex="0"
				onFocus={ onSelect }
				onBlur={ this.maybeDeselect }
				onKeyDown={ onDeselect }
				onMouseEnter={ onMouseEnter }
				onMouseLeave={ onMouseLeave }
				className={ className }
			>
				{ ( isSelected || isHovered ) && <BlockMover uid={ block.uid } /> }
				<div className="editor-visual-editor__block-controls">
					{ isSelected && <BlockSwitcher uid={ block.uid } /> }
					{ isSelected && settings.controls ? (
						<Toolbar
							controls={ settings.controls.map( ( control ) => ( {
								...control,
								onClick: () => control.onClick( block.attributes, this.setAttributes ),
								isActive: () => control.isActive( block.attributes )
							} ) ) } />
					) : null }
				</div>
				<BlockEdit
					isSelected={ isSelected }
					attributes={ block.attributes }
					setAttributes={ this.setAttributes }
					insertBlockAfter={ onInsertAfter }
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
		isSelected: state.selectedBlock === ownProps.uid,
		isHovered: state.hoveredBlock === ownProps.uid
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
		onMouseEnter() {
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
		}
	} )
)( VisualEditorBlock );
