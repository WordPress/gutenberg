/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

function VisualEditorBlock( props ) {
	const { block } = props;
	const settings = wp.blocks.getBlockSettings( block.blockType );

	let BlockEdit;
	if ( settings ) {
		BlockEdit = settings.edit || settings.save;
	}

	if ( ! BlockEdit ) {
		return null;
	}

	function onAttributesChange( attributes ) {
		props.onChange( {
			attributes: {
				...block.attributes,
				...attributes
			}
		} );
	}

	const { isSelected, isHovered } = props;
	const className = classnames( 'editor-visual-editor__block', {
		'is-selected': isSelected,
		'is-hovered': isHovered
	} );

	const { onSelect, onDeselect, onMouseEnter, onMouseLeave } = props;

	// Disable reason: Each block can receive focus but must be able to contain
	// block children. Tab keyboard navigation enabled by tabIndex assignment.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			tabIndex="0"
			onFocus={ onSelect }
			onBlur={ onDeselect }
			onKeyDown={ onDeselect }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			className={ className }
		>
			<BlockEdit
				attributes={ block.attributes }
				onChange={ onAttributesChange } />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

const rectToPlainObj = ( rect ) => (
	{
		top: rect.top,
		right: rect.right,
		bottom: rect.bottom,
		left: rect.left,
		width: rect.width,
		height: rect.height,
		x: rect.x,
		y: rect.y
	} );

const mapStateToProps = ( state, ownProps ) => ( {
	block: state.blocks.byUid[ ownProps.uid ],
	isSelected: !! state.blocks.selected[ ownProps.uid ],
	isHovered: !! state.blocks.hovered[ ownProps.uid ]
} );

const mapDispatchToProps = 	( dispatch, ownProps ) => ( {
	onChange( updates ) {
		dispatch( {
			type: 'UPDATE_BLOCK',
			uid: ownProps.uid,
			updates
		} );
	},
	onSelect( e ) {
		dispatch( {
			type: 'TOGGLE_BLOCK_SELECTED',
			selected: true,
			rect: rectToPlainObj( e.target.getBoundingClientRect() ),
			uid: ownProps.uid
		} );
	},
	onDeselect( e ) {
		dispatch( {
			type: 'TOGGLE_BLOCK_SELECTED',
			selected: false,
			rect: rectToPlainObj( e.target.getBoundingClientRect() ),
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
	}
} );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditorBlock );
