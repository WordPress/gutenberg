/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
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
				className={ classnames( 'editor-block-mover__control', { 'is-disabled': isFirst } ) }
				onClick={ onMoveUp }
				icon="arrow-up-alt2"
			/>
			<IconButton
				className={ classnames( 'editor-block-mover__control', { 'is-disabled': isLast } ) }
				onClick={ onMoveDown }
				icon="arrow-down-alt2"
			/>
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		isFirst: first( state.blocks.order ) === ownProps.uid,
		isLast: last( state.blocks.order ) === ownProps.uid
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
