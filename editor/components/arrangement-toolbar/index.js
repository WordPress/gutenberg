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
import Dashicon from 'components/dashicon';

function BlockArrangement( { onMoveUp, onMoveDown, isFirst, isLast } ) {
	return (
		<div className="editor-arrangement-toolbar">
			<button
				className={ classnames( 'editor-arrangement-toolbar__control', { 'is-disabled': isFirst } ) }
				onClick={ onMoveUp }
			>
				<Dashicon icon="arrow-up-alt2" />
			</button>
			<button
				className={ classnames( 'editor-arrangement-toolbar__control', { 'is-disabled': isLast } ) }
				onClick={ onMoveDown }
			>
				<Dashicon icon="arrow-down-alt2" />
			</button>
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		isFirst: first( state.blocks.order ) === ownProps.uid,
		isLirst: last( state.blocks.order ) === ownProps.uid
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
)( BlockArrangement );
