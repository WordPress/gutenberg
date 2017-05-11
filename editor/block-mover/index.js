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
import { isFirstBlock, isLastBlock } from '../selectors';

function BlockMover( { onMoveUp, onMoveDown, isFirst, isLast } ) {
	return (
		<div className="editor-block-mover">
			<IconButton
				className="editor-block-mover__control"
				onClick={ onMoveUp }
				icon="arrow-up-alt2"
				disabled={ isFirst }
			/>
			<IconButton
				className="editor-block-mover__control"
				onClick={ onMoveDown }
				icon="arrow-down-alt2"
				disabled={ isLast }
			/>
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		isFirst: isFirstBlock( state, ownProps.uid ),
		isLast: isLastBlock( state, ownProps.uid ),
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
