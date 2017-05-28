/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';

/**
 * Internal dependencies
 */
import './style.scss';
import { isFirstBlock, isLastBlock, getBlock } from '../selectors';
import { getBlockSettings } from '../../blocks/api/registration';

function generateOrderTitle( { typeTitle, position, isFirst, isLast, dir } ) {
	const prefix = 'Move "' + typeTitle + '" block from position ' + position;
	let title = '';

	if ( dir > 0 ) {
		// moving down
		title = ( ! isLast ) ?
			prefix + ' down to position ' + ( position + 1 ) :
			'Block "' + typeTitle + '" is at the end of the content and can’t be moved down';
	} else {
		// moving up
		title = ( ! isFirst ) ?
			prefix + ' up to position ' + ( position - 1 ) :
			'Block "' + typeTitle + '" is at the beginning of the content and can’t be moved up';
	}

	return title;
}

function BlockMover( { onMoveUp, onMoveDown, isFirst, isLast, block, order } ) {
	// We emulate a disabled state because forcefully applying the `disabled`
	// attribute on the button while it has focus causes the screen to change
	// to an unfocused state (body as active element) without firing blur on,
	// the rendering parent, leaving it unable to react to focus out.
	const type = getBlockSettings( block.blockType ),
		typeTitle = type.title,
		position = ( order + 1 );

	return (
		<div className="editor-block-mover">
			<IconButton
				className="editor-block-mover__control"
				onClick={ isFirst ? null : onMoveUp }
				label={ generateOrderTitle( { typeTitle, position, isFirst, isLast, dir: -1 } ) }
				icon="arrow-up-alt2"
				aria-disabled={ isFirst }
			/>
			<IconButton
				className="editor-block-mover__control"
				onClick={ isLast ? null : onMoveDown }
				label={ generateOrderTitle( { typeTitle, position, isFirst, isLast, dir: 1 } ) }
				icon="arrow-down-alt2"
				aria-disabled={ isLast }
			/>
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		isFirst: isFirstBlock( state, ownProps.uid ),
		isLast: isLastBlock( state, ownProps.uid ),
		block: getBlock( state, ownProps.uid ),
	} ),
	( dispatch, ownProps ) => ( {
		onMoveDown() {
			dispatch( {
				type: 'MOVE_BLOCK_DOWN',
				uid: ownProps.uid,
			} );
		},
		onMoveUp() {
			dispatch( {
				type: 'MOVE_BLOCK_UP',
				uid: ownProps.uid,
			} );
		},
	} )
)( BlockMover );
