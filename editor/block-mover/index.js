/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { isFirstBlock, isLastBlock, getBlock } from '../selectors';
import { getBlockSettings } from '../../blocks/api/registration';
import generateOrderTitle from './generate-order-title';

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
		isFirst: isFirstBlock( state, first( ownProps.uids ) ),
		isLast: isLastBlock( state, last( ownProps.uids ) ),
		block: getBlock( state, ownProps.uid ),
	} ),
	( dispatch, ownProps ) => ( {
		onMoveDown() {
			dispatch( {
				type: 'MOVE_BLOCKS_DOWN',
				uids: ownProps.uids,
			} );
		},
		onMoveUp() {
			dispatch( {
				type: 'MOVE_BLOCKS_UP',
				uids: ownProps.uids,
			} );
		},
	} )
)( BlockMover );
