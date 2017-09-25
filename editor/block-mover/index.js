/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { canMoveBlockUp, isLastBlock, getBlockIndex, getBlock } from '../selectors';
import { getBlockMoverLabel } from './mover-label';

function BlockMover( { onMoveUp, onMoveDown, canMoveUp, canMoveDown, uids, blockType, firstIndex } ) {
	// We emulate a disabled state because forcefully applying the `disabled`
	// attribute on the button while it has focus causes the screen to change
	// to an unfocused state (body as active element) without firing blur on,
	// the rendering parent, leaving it unable to react to focus out.
	return (
		<div className="editor-block-mover">
			<IconButton
				className="editor-block-mover__control"
				onClick={ ! canMoveUp ? null : onMoveUp }
				icon="arrow-up-alt2"
				tooltip={ __( 'Move Up' ) }
				label={ getBlockMoverLabel(
					uids.length,
					blockType && blockType.title,
					firstIndex,
					canMoveUp,
					canMoveDown,
					-1,
				) }
				aria-disabled={ ! canMoveUp }
			/>
			<IconButton
				className="editor-block-mover__control"
				onClick={ ! canMoveDown ? null : onMoveDown }
				icon="arrow-down-alt2"
				tooltip={ __( 'Move Down' ) }
				label={ getBlockMoverLabel(
					uids.length,
					blockType && blockType.title,
					firstIndex,
					canMoveUp,
					canMoveDown,
					1,
				) }
				aria-disabled={ ! canMoveDown }
			/>
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		canMoveUp: canMoveBlockUp( state, first( ownProps.uids ) ),
		canMoveDown: ! isLastBlock( state, last( ownProps.uids ) ),
		firstIndex: getBlockIndex( state, first( ownProps.uids ) ),
		blockType: getBlockType( getBlock( state, first( ownProps.uids ) ).name ),
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
