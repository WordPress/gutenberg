/**
 * External dependencies
 */
import refx from 'refx';
import multi from 'redux-multi';
import { every, filter, first, flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import effects from './effects';
import { canInsertBlockType, getBlockName, getBlockRootClientId, getTemplateLock } from './selectors';

/**
 * The allowedBlocksMiddleware middleware makes sure we never add a block when that addition is not possible.
 * In order to accomplish this validation allowedBlocksMiddleware makes use of canInsertBlockType selector
 * and custom logic for replace, move and multi-block insertion.
 * The primary objective of middleware is to make sure the store never gets in an inconsistent state with a block
 * added inside in a forbidden area. So for example, if an external plugin tries to insert blocks when a locking exists
 * the action will be discarded.
 *
 * @param  {Object}   store Middleware Store Object.
 * @return {Function}       Redux Middleware.
 */
const allowedBlocksMiddleware = ( store ) => ( next ) => ( action ) => {
	if ( action.ignoreAllowedBlocksValidation ) {
		next( action );
		return;
	}
	switch ( action.type ) {
		// When inserting we allow the action if at least one of the blocks can be inserted.
		// Blocks that can not be inserted are removed from the action.
		case 'INSERT_BLOCKS': {
			const allowedBlocks = filter( action.blocks, ( block ) =>
				block &&
				canInsertBlockType( store.getState(), block.name, action.rootClientId )
			);
			if ( allowedBlocks.length ) {
				next( {
					...action,
					blocks: allowedBlocks,
				} );
			}
			return;
		}
		case 'MOVE_BLOCK_TO_POSITION': {
			const { fromRootClientId, toRootClientId, clientId } = action;
			const state = store.getState();
			const blockName = getBlockName( state, clientId );

			// If locking is equal to all on the original clientId (fromRootClientId) it is not possible to move the block to any other position.
			// In the other cases (locking !== all ), if moving inside the same block the move is always possible
			// if moving to other parent block, the move is possible if we can insert a block of the same type inside the new parent block.
			if (
				getTemplateLock( state, fromRootClientId ) !== 'all' &&
				( fromRootClientId === toRootClientId || canInsertBlockType( store.getState(), blockName, toRootClientId ) )
			) {
				next( action );
			}
			return;
		}
		case 'REPLACE_BLOCKS': {
			const clientId = getBlockRootClientId( store.getState(), first( action.clientIds ) );
			// Replace is valid if the new blocks can be inserted in the root block
			// or if we had a block of the same type in the position of the block being replaced.
			const isOperationValid = every( action.blocks, ( block, index ) => {
				if ( canInsertBlockType( store.getState(), block.name, clientId ) ) {
					return true;
				}
				const clientIdToReplace = action.clientIds[ index ];
				const nameOfBlockToReplace = clientIdToReplace && getBlockName( store.getState(), clientIdToReplace );
				return nameOfBlockToReplace && nameOfBlockToReplace === block.name;
			} );
			if ( isOperationValid ) {
				next( action );
			}
			return;
		}
	}
	next( action );
};

/**
 * Applies the custom middlewares used specifically in the editor module.
 *
 * @param {Object} store Store Object.
 *
 * @return {Object} Update Store Object.
 */
function applyMiddlewares( store ) {
	const middlewares = [
		refx( effects ),
		multi,
		allowedBlocksMiddleware,
	];

	let enhancedDispatch = () => {
		throw new Error(
			'Dispatching while constructing your middleware is not allowed. ' +
			'Other middleware would not be applied to this dispatch.'
		);
	};
	let chain = [];

	const middlewareAPI = {
		getState: store.getState,
		dispatch: ( ...args ) => enhancedDispatch( ...args ),
	};
	chain = middlewares.map( ( middleware ) => middleware( middlewareAPI ) );
	enhancedDispatch = flowRight( ...chain )( store.dispatch );

	store.dispatch = enhancedDispatch;
	return store;
}

export default applyMiddlewares;
