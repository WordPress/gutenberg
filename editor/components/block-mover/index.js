/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import IconButton from 'components/icon-button';

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
		isFirst: first( state.editor.blockOrder ) === ownProps.uid,
		isLast: last( state.editor.blockOrder ) === ownProps.uid
	} ),
	( dispatch, ownProps ) => ( {
		onMoveDown() {
			dispatch( {
				type: 'MOVE_BLOCK_DOWN',
				uid: ownProps.uid
			} );
		},
		onMoveUp() {
			dispatch( {
				type: 'MOVE_BLOCK_UP',
				uid: ownProps.uid
			} );
		}
	} )
)( BlockMover );
