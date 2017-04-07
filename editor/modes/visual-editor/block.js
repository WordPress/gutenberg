/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

const VisualEditorBlock = ( props ) => {
	const { block, onChange } = props;
	const settings = wp.blocks.getBlockSettings( block.blockType );
	let _ref = null; // closure on the ref of this dom element

	let BlockEdit;
	if ( settings ) {
		BlockEdit = settings.edit || settings.save;
	}

	if ( ! BlockEdit ) {
		return null;
	}

	const { isSelected, isHovered } = props;
	const className = classnames( 'editor-visual-editor__block', {
		'is-selected': isSelected,
		'is-hovered': isHovered
	} );

	const { isFocused, rect, onSelect, onDeselect, onMouseEnter, onMouseLeave } = props;

	// Disable reason: Each block can receive focus but must be able to contain
	// block children. Tab keyboard navigation enabled by tabIndex assignment.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div role="presentation"
			ref={ ( el ) => ( _ref = el ) }
			onFocus={ ( e ) => ( onSelect( e, _ref ) ) }
			onBlur={ onDeselect }
			onKeyDown={ onDeselect }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			className={ className }
		>
			<BlockEdit
				rect={ rect }
				isFocused={ isFocused }
				attributes={ block.attributes }
				onChange={ ( attributes ) => onChange( { attributes: { ...block.attributes, ...attributes } } ) } />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
};

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
	isHovered: !! state.blocks.hovered[ ownProps.uid ],
	isFocused: ownProps.uid === state.blocks.focused.uid,
	rect: state.blocks.focused.rect
} );

const mapDispatchToProps = 	( dispatch, ownProps ) => ( {
	onChange( updates ) {
		dispatch( {
			type: 'UPDATE_BLOCK',
			uid: ownProps.uid,
			updates
		} );
	},
	onSelect( e, domEl ) {
		const { target } = e;
		dispatch( {
			type: 'TOGGLE_BLOCK_SELECTED',
			selected: true,
			uid: ownProps.uid
		} );
		// if something in this block gets focus (eg, the focus target)
		// - set the focused uid and rect to that of the containing block
		if ( domEl && target && domEl.contains( target ) ) {
			dispatch( {
				type: 'FOCUS_BLOCK',
				uid: ownProps.uid,
				rect: rectToPlainObj( domEl.getBoundingClientRect() )
			} );
		}
	},
	onDeselect( ) {
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
	}
} );

export default connect( mapStateToProps, mapDispatchToProps )( VisualEditorBlock );
