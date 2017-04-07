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

	function setAttributes( attributes ) {
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
				setAttributes={ setAttributes } />
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ],
		isSelected: !! state.blocks.selected[ ownProps.uid ],
		isHovered: !! state.blocks.hovered[ ownProps.uid ]
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
		}
	} )
)( VisualEditorBlock );
