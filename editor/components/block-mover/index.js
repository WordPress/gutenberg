/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlockMoverLabel } from './mover-label';
import { isFirstBlock, isLastBlock, getBlockIndex, getBlock } from '../../store/selectors';
import { selectBlock } from '../../store/actions';

export function BlockMover( { onMoveUp, onMoveDown, isFirst, isLast, uids, blockType, firstIndex, isLocked } ) {
	if ( isLocked ) {
		return null;
	}

	// We emulate a disabled state because forcefully applying the `disabled`
	// attribute on the button while it has focus causes the screen to change
	// to an unfocused state (body as active element) without firing blur on,
	// the rendering parent, leaving it unable to react to focus out.
	return (
		<div className="editor-block-mover">
			<IconButton
				className="editor-block-mover__control"
				onClick={ isFirst ? null : onMoveUp }
				icon={ <svg tabIndex="-1" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M12.293 12.207L9 8.914l-3.293 3.293-1.414-1.414L9 6.086l4.707 4.707z" /></svg> }
				tooltip={ __( 'Move Up' ) }
				label={ getBlockMoverLabel(
					uids.length,
					blockType && blockType.title,
					firstIndex,
					isFirst,
					isLast,
					-1,
				) }
				aria-disabled={ isFirst }
			/>
			<IconButton
				className="editor-block-mover__control"
				onClick={ isLast ? null : onMoveDown }
				icon={ <svg tabIndex="-1" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M12.293 6.086L9 9.379 5.707 6.086 4.293 7.5 9 12.207 13.707 7.5z" /></svg> }
				tooltip={ __( 'Move Down' ) }
				label={ getBlockMoverLabel(
					uids.length,
					blockType && blockType.title,
					firstIndex,
					isFirst,
					isLast,
					1,
				) }
				aria-disabled={ isLast }
			/>
		</div>
	);
}

export default compose(
	connect(
		( state, ownProps ) => {
			const block = getBlock( state, first( ownProps.uids ) );

			return ( {
				isFirst: isFirstBlock( state, first( ownProps.uids ) ),
				isLast: isLastBlock( state, last( ownProps.uids ) ),
				firstIndex: getBlockIndex( state, first( ownProps.uids ) ),
				blockType: block ? getBlockType( block.name ) : null,
			} );
		},
		( dispatch, ownProps ) => ( {
			onMoveDown() {
				if ( ownProps.uids.length === 1 ) {
					dispatch( selectBlock( first( ownProps.uids ) ) );
				}

				dispatch( {
					type: 'MOVE_BLOCKS_DOWN',
					uids: ownProps.uids,
				} );
			},
			onMoveUp() {
				if ( ownProps.uids.length === 1 ) {
					dispatch( selectBlock( first( ownProps.uids ) ) );
				}

				dispatch( {
					type: 'MOVE_BLOCKS_UP',
					uids: ownProps.uids,
				} );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: templateLock === 'all',
		};
	} ),
)( BlockMover );
