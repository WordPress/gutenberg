/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

/**
 * WordPress dependencies
 */
import { pipe } from '@wordpress/compose';
import { combineReducers, select } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import {
	store as blocksStore,
	privateApis as blocksPrivateApis,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS } from './defaults';
import { insertAt, moveTo } from './array';
import { sectionRootClientIdKey } from './private-keys';
import { unlock } from '../lock-unlock';

const { isContentBlock } = unlock( blocksPrivateApis );

const identity = ( x ) => x;

/**
 * Given an array of blocks, returns an object where each key is a nesting
 * context, the value of which is an array of block client IDs existing within
 * that nesting context.
 *
 * @param {Array}   blocks       Blocks to map.
 * @param {?string} rootClientId Assumed root client ID.
 *
 * @return {Object} Block order map object.
 */
function mapBlockOrder( blocks, rootClientId = '' ) {
	const result = new Map();
	const current = [];
	result.set( rootClientId, current );
	blocks.forEach( ( block ) => {
		const { clientId, innerBlocks } = block;
		current.push( clientId );
		mapBlockOrder( innerBlocks, clientId ).forEach(
			( order, subClientId ) => {
				result.set( subClientId, order );
			}
		);
	} );
	return result;
}

/**
 * Given an array of blocks, returns an object where each key contains
 * the clientId of the block and the value is the parent of the block.
 *
 * @param {Array}   blocks       Blocks to map.
 * @param {?string} rootClientId Assumed root client ID.
 *
 * @return {Object} Block order map object.
 */
function mapBlockParents( blocks, rootClientId = '' ) {
	const result = [];
	const stack = [ [ rootClientId, blocks ] ];
	while ( stack.length ) {
		const [ parent, currentBlocks ] = stack.shift();
		currentBlocks.forEach( ( { innerBlocks, ...block } ) => {
			result.push( [ block.clientId, parent ] );
			if ( innerBlocks?.length ) {
				stack.push( [ block.clientId, innerBlocks ] );
			}
		} );
	}
	return result;
}

/**
 * Helper method to iterate through all blocks, recursing into inner blocks,
 * applying a transformation function to each one.
 * Returns a flattened object with the transformed blocks.
 *
 * @param {Array}    blocks    Blocks to flatten.
 * @param {Function} transform Transforming function to be applied to each block.
 *
 * @return {Array} Flattened object.
 */
function flattenBlocks( blocks, transform = identity ) {
	const result = [];

	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		stack.push( ...innerBlocks );
		result.push( [ block.clientId, transform( block ) ] );
	}

	return result;
}

function getFlattenedClientIds( blocks ) {
	const result = {};
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		stack.push( ...innerBlocks );
		result[ block.clientId ] = true;
	}

	return result;
}

/**
 * Given an array of blocks, returns an object containing all blocks, without
 * attributes, recursing into inner blocks. Keys correspond to the block client
 * ID, the value of which is the attributes object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Array} Flattened block attributes object.
 */
function getFlattenedBlocksWithoutAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => {
		const { attributes, ...restBlock } = block;
		return restBlock;
	} );
}

/**
 * Given an array of blocks, returns an object containing all block attributes,
 * recursing into inner blocks. Keys correspond to the block client ID, the
 * value of which is the attributes object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Array} Flattened block attributes object.
 */
function getFlattenedBlockAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => block.attributes );
}

/**
 * Returns true if the two object arguments have the same keys, or false
 * otherwise.
 *
 * @param {Object} a First object.
 * @param {Object} b Second object.
 *
 * @return {boolean} Whether the two objects have the same keys.
 */
export function hasSameKeys( a, b ) {
	return fastDeepEqual( Object.keys( a ), Object.keys( b ) );
}

/**
 * Returns true if, given the currently dispatching action and the previously
 * dispatched action, the two actions are updating the same block attribute, or
 * false otherwise.
 *
 * @param {Object} action     Currently dispatching action.
 * @param {Object} lastAction Previously dispatched action.
 *
 * @return {boolean} Whether actions are updating the same block attribute.
 */
export function isUpdatingSameBlockAttribute( action, lastAction ) {
	return (
		action.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		lastAction !== undefined &&
		lastAction.type === 'UPDATE_BLOCK_ATTRIBUTES' &&
		fastDeepEqual( action.clientIds, lastAction.clientIds ) &&
		hasSameKeys( action.attributes, lastAction.attributes )
	);
}

function updateBlockTreeForBlocks( state, blocks ) {
	const treeToUpdate = state.tree;
	const stack = [ ...blocks ];
	const flattenedBlocks = [ ...blocks ];
	while ( stack.length ) {
		const block = stack.shift();
		stack.push( ...block.innerBlocks );
		flattenedBlocks.push( ...block.innerBlocks );
	}
	// Create objects before mutating them, that way it's always defined.
	for ( const block of flattenedBlocks ) {
		treeToUpdate.set( block.clientId, {} );
	}
	for ( const block of flattenedBlocks ) {
		treeToUpdate.set(
			block.clientId,
			Object.assign( treeToUpdate.get( block.clientId ), {
				...state.byClientId.get( block.clientId ),
				attributes: state.attributes.get( block.clientId ),
				innerBlocks: block.innerBlocks.map( ( subBlock ) =>
					treeToUpdate.get( subBlock.clientId )
				),
			} )
		);
	}
}

function updateParentInnerBlocksInTree(
	state,
	updatedClientIds,
	updateChildrenOfUpdatedClientIds = false
) {
	const treeToUpdate = state.tree;
	const uncontrolledParents = new Set( [] );
	const controlledParents = new Set();
	for ( const clientId of updatedClientIds ) {
		let current = updateChildrenOfUpdatedClientIds
			? clientId
			: state.parents.get( clientId );
		do {
			if ( state.controlledInnerBlocks[ current ] ) {
				// Should stop on controlled blocks.
				// If we reach a controlled parent, break out of the loop.
				controlledParents.add( current );
				break;
			} else {
				// Else continue traversing up through parents.
				uncontrolledParents.add( current );
				current = state.parents.get( current );
			}
		} while ( current !== undefined );
	}

	// To make sure the order of assignments doesn't matter,
	// we first create empty objects and mutates the inner blocks later.
	for ( const clientId of uncontrolledParents ) {
		treeToUpdate.set( clientId, { ...treeToUpdate.get( clientId ) } );
	}
	for ( const clientId of uncontrolledParents ) {
		treeToUpdate.get( clientId ).innerBlocks = (
			state.order.get( clientId ) || []
		).map( ( subClientId ) => treeToUpdate.get( subClientId ) );
	}

	// Controlled parent blocks, need a dedicated key for their inner blocks
	// to be used when doing getBlocks( controlledBlockClientId ).
	for ( const clientId of controlledParents ) {
		treeToUpdate.set( 'controlled||' + clientId, {
			innerBlocks: ( state.order.get( clientId ) || [] ).map(
				( subClientId ) => treeToUpdate.get( subClientId )
			),
		} );
	}
}

/**
 * Higher-order reducer intended to compute full block objects key for each block in the post.
 * This is a denormalization to optimize the performance of the getBlock selectors and avoid
 * recomputing the block objects and avoid heavy memoization.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withBlockTree =
	( reducer ) =>
	( state = {}, action ) => {
		const newState = reducer( state, action );

		if ( newState === state ) {
			return state;
		}

		newState.tree = state.tree ? state.tree : new Map();
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS': {
				newState.tree = new Map( newState.tree );
				updateBlockTreeForBlocks( newState, action.blocks );
				updateParentInnerBlocksInTree(
					newState,
					action.rootClientId ? [ action.rootClientId ] : [ '' ],
					true
				);
				break;
			}
			case 'UPDATE_BLOCK':
				newState.tree = new Map( newState.tree );
				newState.tree.set( action.clientId, {
					...newState.tree.get( action.clientId ),
					...newState.byClientId.get( action.clientId ),
					attributes: newState.attributes.get( action.clientId ),
				} );
				updateParentInnerBlocksInTree(
					newState,
					[ action.clientId ],
					false
				);
				break;
			case 'SYNC_DERIVED_BLOCK_ATTRIBUTES':
			case 'UPDATE_BLOCK_ATTRIBUTES': {
				newState.tree = new Map( newState.tree );
				action.clientIds.forEach( ( clientId ) => {
					newState.tree.set( clientId, {
						...newState.tree.get( clientId ),
						attributes: newState.attributes.get( clientId ),
					} );
				} );
				updateParentInnerBlocksInTree(
					newState,
					action.clientIds,
					false
				);
				break;
			}
			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const inserterClientIds = getFlattenedClientIds(
					action.blocks
				);
				newState.tree = new Map( newState.tree );
				action.replacedClientIds.forEach( ( clientId ) => {
					newState.tree.delete( clientId );
					// Controlled inner blocks are only removed
					// if the block doesn't move to another position
					// otherwise their content will be lost.
					if ( ! inserterClientIds[ clientId ] ) {
						newState.tree.delete( 'controlled||' + clientId );
					}
				} );

				updateBlockTreeForBlocks( newState, action.blocks );
				updateParentInnerBlocksInTree(
					newState,
					action.blocks.map( ( b ) => b.clientId ),
					false
				);

				// If there are no replaced blocks, it means we're removing blocks so we need to update their parent.
				const parentsOfRemovedBlocks = [];
				for ( const clientId of action.clientIds ) {
					const parentId = state.parents.get( clientId );
					if (
						parentId !== undefined &&
						( parentId === '' ||
							newState.byClientId.get( parentId ) )
					) {
						parentsOfRemovedBlocks.push( parentId );
					}
				}
				updateParentInnerBlocksInTree(
					newState,
					parentsOfRemovedBlocks,
					true
				);
				break;
			}
			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				const parentsOfRemovedBlocks = [];
				for ( const clientId of action.clientIds ) {
					const parentId = state.parents.get( clientId );
					if (
						parentId !== undefined &&
						( parentId === '' ||
							newState.byClientId.get( parentId ) )
					) {
						parentsOfRemovedBlocks.push( parentId );
					}
				}
				newState.tree = new Map( newState.tree );
				action.removedClientIds.forEach( ( clientId ) => {
					newState.tree.delete( clientId );
					newState.tree.delete( 'controlled||' + clientId );
				} );
				updateParentInnerBlocksInTree(
					newState,
					parentsOfRemovedBlocks,
					true
				);
				break;
			case 'MOVE_BLOCKS_TO_POSITION': {
				const updatedBlockUids = [];
				if ( action.fromRootClientId ) {
					updatedBlockUids.push( action.fromRootClientId );
				} else {
					updatedBlockUids.push( '' );
				}
				if ( action.toRootClientId ) {
					updatedBlockUids.push( action.toRootClientId );
				}
				newState.tree = new Map( newState.tree );
				updateParentInnerBlocksInTree(
					newState,
					updatedBlockUids,
					true
				);
				break;
			}
			case 'MOVE_BLOCKS_UP':
			case 'MOVE_BLOCKS_DOWN': {
				const updatedBlockUids = [
					action.rootClientId ? action.rootClientId : '',
				];
				newState.tree = new Map( newState.tree );
				updateParentInnerBlocksInTree(
					newState,
					updatedBlockUids,
					true
				);
				break;
			}
			case 'SAVE_REUSABLE_BLOCK_SUCCESS': {
				const updatedBlockUids = [];
				newState.attributes.forEach( ( attributes, clientId ) => {
					if (
						newState.byClientId.get( clientId ).name ===
							'core/block' &&
						attributes.ref === action.updatedId
					) {
						updatedBlockUids.push( clientId );
					}
				} );
				newState.tree = new Map( newState.tree );
				updatedBlockUids.forEach( ( clientId ) => {
					newState.tree.set( clientId, {
						...newState.byClientId.get( clientId ),
						attributes: newState.attributes.get( clientId ),
						innerBlocks: newState.tree.get( clientId ).innerBlocks,
					} );
				} );
				updateParentInnerBlocksInTree(
					newState,
					updatedBlockUids,
					false
				);
			}
		}

		return newState;
	};

/**
 * Higher-order reducer intended to augment the blocks reducer, assigning an
 * `isPersistentChange` property value corresponding to whether a change in
 * state can be considered as persistent. All changes are considered persistent
 * except when updating the same block attribute as in the previous action.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
function withPersistentBlockChange( reducer ) {
	let lastAction;
	let markNextChangeAsNotPersistent = false;
	let explicitPersistent;

	return ( state, action ) => {
		let nextState = reducer( state, action );

		let nextIsPersistentChange;
		if ( action.type === 'SET_EXPLICIT_PERSISTENT' ) {
			explicitPersistent = action.isPersistentChange;
			nextIsPersistentChange = state.isPersistentChange ?? true;
		}

		if ( explicitPersistent !== undefined ) {
			nextIsPersistentChange = explicitPersistent;
			return nextIsPersistentChange === nextState.isPersistentChange
				? nextState
				: {
						...nextState,
						isPersistentChange: nextIsPersistentChange,
				  };
		}

		const isExplicitPersistentChange =
			action.type === 'MARK_LAST_CHANGE_AS_PERSISTENT' ||
			markNextChangeAsNotPersistent;

		// Defer to previous state value (or default) unless changing or
		// explicitly marking as persistent.
		if ( state === nextState && ! isExplicitPersistentChange ) {
			markNextChangeAsNotPersistent =
				action.type === 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT';

			nextIsPersistentChange = state?.isPersistentChange ?? true;
			if ( state.isPersistentChange === nextIsPersistentChange ) {
				return state;
			}

			return {
				...nextState,
				isPersistentChange: nextIsPersistentChange,
			};
		}

		nextState = {
			...nextState,
			isPersistentChange: isExplicitPersistentChange
				? ! markNextChangeAsNotPersistent
				: ! isUpdatingSameBlockAttribute( action, lastAction ),
		};

		// In comparing against the previous action, consider only those which
		// would have qualified as one which would have been ignored or not
		// have resulted in a changed state.
		lastAction = action;
		markNextChangeAsNotPersistent =
			action.type === 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT';

		return nextState;
	};
}

/**
 * Higher-order reducer intended to augment the blocks reducer, assigning an
 * `isIgnoredChange` property value corresponding to whether a change in state
 * can be considered as ignored. A change is considered ignored when the result
 * of an action not incurred by direct user interaction.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
function withIgnoredBlockChange( reducer ) {
	/**
	 * Set of action types for which a blocks state change should be ignored.
	 *
	 * @type {Set}
	 */
	const IGNORED_ACTION_TYPES = new Set( [ 'RECEIVE_BLOCKS' ] );

	return ( state, action ) => {
		const nextState = reducer( state, action );

		if ( nextState !== state ) {
			nextState.isIgnoredChange = IGNORED_ACTION_TYPES.has( action.type );
		}

		return nextState;
	};
}

/**
 * Higher-order reducer targeting the combined blocks reducer, augmenting
 * block client IDs in remove action to include cascade of inner blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withInnerBlocksRemoveCascade = ( reducer ) => ( state, action ) => {
	// Gets all children which need to be removed.
	const getAllChildren = ( clientIds ) => {
		let result = clientIds;
		for ( let i = 0; i < result.length; i++ ) {
			if (
				! state.order.get( result[ i ] ) ||
				( action.keepControlledInnerBlocks &&
					action.keepControlledInnerBlocks[ result[ i ] ] )
			) {
				continue;
			}

			if ( result === clientIds ) {
				result = [ ...result ];
			}

			result.push( ...state.order.get( result[ i ] ) );
		}
		return result;
	};

	if ( state ) {
		switch ( action.type ) {
			case 'REMOVE_BLOCKS':
				action = {
					...action,
					type: 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN',
					removedClientIds: getAllChildren( action.clientIds ),
				};
				break;
			case 'REPLACE_BLOCKS':
				action = {
					...action,
					type: 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN',
					replacedClientIds: getAllChildren( action.clientIds ),
				};
				break;
		}
	}

	return reducer( state, action );
};

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `RESET_BLOCKS` action. When dispatched, this action will replace all
 * blocks that exist in the post, leaving blocks that exist only in state (e.g.
 * reusable blocks and blocks controlled by inner blocks controllers) alone.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withBlockReset = ( reducer ) => ( state, action ) => {
	if ( action.type === 'RESET_BLOCKS' ) {
		const newState = {
			...state,
			byClientId: new Map(
				getFlattenedBlocksWithoutAttributes( action.blocks )
			),
			attributes: new Map( getFlattenedBlockAttributes( action.blocks ) ),
			order: mapBlockOrder( action.blocks ),
			parents: new Map( mapBlockParents( action.blocks ) ),
			controlledInnerBlocks: {},
		};

		newState.tree = new Map( state?.tree );
		updateBlockTreeForBlocks( newState, action.blocks );
		newState.tree.set( '', {
			innerBlocks: action.blocks.map( ( subBlock ) =>
				newState.tree.get( subBlock.clientId )
			),
		} );

		return newState;
	}

	return reducer( state, action );
};

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `REPLACE_INNER_BLOCKS` action. When dispatched, this action the state
 * should become equivalent to the execution of a `REMOVE_BLOCKS` action
 * containing all the child's of the root block followed by the execution of
 * `INSERT_BLOCKS` with the new blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withReplaceInnerBlocks = ( reducer ) => ( state, action ) => {
	if ( action.type !== 'REPLACE_INNER_BLOCKS' ) {
		return reducer( state, action );
	}

	// Finds every nested inner block controller. We must check the action blocks
	// and not just the block parent state because some inner block controllers
	// should be deleted if specified, whereas others should not be deleted. If
	// a controlled should not be deleted, then we need to avoid deleting its
	// inner blocks from the block state because its inner blocks will not be
	// attached to the block in the action.
	const nestedControllers = {};
	if ( Object.keys( state.controlledInnerBlocks ).length ) {
		const stack = [ ...action.blocks ];
		while ( stack.length ) {
			const { innerBlocks, ...block } = stack.shift();
			stack.push( ...innerBlocks );
			if ( !! state.controlledInnerBlocks[ block.clientId ] ) {
				nestedControllers[ block.clientId ] = true;
			}
		}
	}

	// The `keepControlledInnerBlocks` prop will keep the inner blocks of the
	// marked block in the block state so that they can be reattached to the
	// marked block when we re-insert everything a few lines below.
	let stateAfterBlocksRemoval = state;
	if ( state.order.get( action.rootClientId ) ) {
		stateAfterBlocksRemoval = reducer( stateAfterBlocksRemoval, {
			type: 'REMOVE_BLOCKS',
			keepControlledInnerBlocks: nestedControllers,
			clientIds: state.order.get( action.rootClientId ),
		} );
	}
	let stateAfterInsert = stateAfterBlocksRemoval;
	if ( action.blocks.length ) {
		stateAfterInsert = reducer( stateAfterInsert, {
			...action,
			type: 'INSERT_BLOCKS',
			index: 0,
		} );

		// We need to re-attach the controlled inner blocks to the blocks tree and
		// preserve their block order. Otherwise, an inner block controller's blocks
		// will be deleted entirely from its entity.
		const stateAfterInsertOrder = new Map( stateAfterInsert.order );
		Object.keys( nestedControllers ).forEach( ( key ) => {
			if ( state.order.get( key ) ) {
				stateAfterInsertOrder.set( key, state.order.get( key ) );
			}
		} );
		stateAfterInsert.order = stateAfterInsertOrder;
		stateAfterInsert.tree = new Map( stateAfterInsert.tree );
		Object.keys( nestedControllers ).forEach( ( _key ) => {
			const key = `controlled||${ _key }`;
			if ( state.tree.has( key ) ) {
				stateAfterInsert.tree.set( key, state.tree.get( key ) );
			}
		} );
	}
	return stateAfterInsert;
};

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `SAVE_REUSABLE_BLOCK_SUCCESS` action. This action can't be handled by
 * regular reducers and needs a higher-order reducer since it needs access to
 * both `byClientId` and `attributes` simultaneously.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withSaveReusableBlock = ( reducer ) => ( state, action ) => {
	if ( state && action.type === 'SAVE_REUSABLE_BLOCK_SUCCESS' ) {
		const { id, updatedId } = action;

		// If a temporary reusable block is saved, we swap the temporary id with the final one.
		if ( id === updatedId ) {
			return state;
		}

		state = { ...state };
		state.attributes = new Map( state.attributes );
		state.attributes.forEach( ( attributes, clientId ) => {
			const { name } = state.byClientId.get( clientId );
			if ( name === 'core/block' && attributes.ref === id ) {
				state.attributes.set( clientId, {
					...attributes,
					ref: updatedId,
				} );
			}
		} );
	}

	return reducer( state, action );
};
/**
 * Higher-order reducer which removes blocks from state when switching parent block controlled state.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withResetControlledBlocks = ( reducer ) => ( state, action ) => {
	if ( action.type === 'SET_HAS_CONTROLLED_INNER_BLOCKS' ) {
		// when switching a block from controlled to uncontrolled or inverse,
		// we need to remove its content first.
		const tempState = reducer( state, {
			type: 'REPLACE_INNER_BLOCKS',
			rootClientId: action.clientId,
			blocks: [],
		} );
		return reducer( tempState, action );
	}

	return reducer( state, action );
};

/**
 * Reducer returning the blocks state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const blocks = pipe(
	combineReducers,
	withSaveReusableBlock, // Needs to be before withBlockCache.
	withBlockTree, // Needs to be before withInnerBlocksRemoveCascade.
	withInnerBlocksRemoveCascade,
	withReplaceInnerBlocks, // Needs to be after withInnerBlocksRemoveCascade.
	withBlockReset,
	withPersistentBlockChange,
	withIgnoredBlockChange,
	withResetControlledBlocks
)( {
	// The state is using a Map instead of a plain object for performance reasons.
	// You can run the "./test/performance.js" unit test to check the impact
	// code changes can have on this reducer.
	byClientId( state = new Map(), action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS': {
				const newState = new Map( state );
				getFlattenedBlocksWithoutAttributes( action.blocks ).forEach(
					( [ key, value ] ) => {
						newState.set( key, value );
					}
				);
				return newState;
			}
			case 'UPDATE_BLOCK': {
				// Ignore updates if block isn't known.
				if ( ! state.has( action.clientId ) ) {
					return state;
				}

				// Do nothing if only attributes change.
				const { attributes, ...changes } = action.updates;
				if ( Object.values( changes ).length === 0 ) {
					return state;
				}

				const newState = new Map( state );
				newState.set( action.clientId, {
					...state.get( action.clientId ),
					...changes,
				} );
				return newState;
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				if ( ! action.blocks ) {
					return state;
				}

				const newState = new Map( state );
				action.replacedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );

				getFlattenedBlocksWithoutAttributes( action.blocks ).forEach(
					( [ key, value ] ) => {
						newState.set( key, value );
					}
				);
				return newState;
			}

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const newState = new Map( state );
				action.removedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				return newState;
			}
		}

		return state;
	},

	// The state is using a Map instead of a plain object for performance reasons.
	// You can run the "./test/performance.js" unit test to check the impact
	// code changes can have on this reducer.
	attributes( state = new Map(), action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS': {
				const newState = new Map( state );
				getFlattenedBlockAttributes( action.blocks ).forEach(
					( [ key, value ] ) => {
						newState.set( key, value );
					}
				);
				return newState;
			}

			case 'UPDATE_BLOCK': {
				// Ignore updates if block isn't known or there are no attribute changes.
				if (
					! state.get( action.clientId ) ||
					! action.updates.attributes
				) {
					return state;
				}

				const newState = new Map( state );
				newState.set( action.clientId, {
					...state.get( action.clientId ),
					...action.updates.attributes,
				} );
				return newState;
			}

			case 'SYNC_DERIVED_BLOCK_ATTRIBUTES':
			case 'UPDATE_BLOCK_ATTRIBUTES': {
				// Avoid a state change if none of the block IDs are known.
				if ( action.clientIds.every( ( id ) => ! state.get( id ) ) ) {
					return state;
				}

				let hasChange = false;
				const newState = new Map( state );
				for ( const clientId of action.clientIds ) {
					const updatedAttributeEntries = Object.entries(
						!! action.options?.uniqueByBlock
							? action.attributes[ clientId ]
							: action.attributes ?? {}
					);
					if ( updatedAttributeEntries.length === 0 ) {
						continue;
					}
					let hasUpdatedAttributes = false;
					const existingAttributes = state.get( clientId );
					const newAttributes = {};
					updatedAttributeEntries.forEach( ( [ key, value ] ) => {
						if ( existingAttributes[ key ] !== value ) {
							hasUpdatedAttributes = true;
							newAttributes[ key ] = value;
						}
					} );
					hasChange = hasChange || hasUpdatedAttributes;
					if ( hasUpdatedAttributes ) {
						newState.set( clientId, {
							...existingAttributes,
							...newAttributes,
						} );
					}
				}

				return hasChange ? newState : state;
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				if ( ! action.blocks ) {
					return state;
				}

				const newState = new Map( state );
				action.replacedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				getFlattenedBlockAttributes( action.blocks ).forEach(
					( [ key, value ] ) => {
						newState.set( key, value );
					}
				);
				return newState;
			}

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const newState = new Map( state );
				action.removedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				return newState;
			}
		}

		return state;
	},

	// The state is using a Map instead of a plain object for performance reasons.
	// You can run the "./test/performance.js" unit test to check the impact
	// code changes can have on this reducer.
	order( state = new Map(), action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS': {
				const blockOrder = mapBlockOrder( action.blocks );
				const newState = new Map( state );
				blockOrder.forEach( ( order, clientId ) => {
					if ( clientId !== '' ) {
						newState.set( clientId, order );
					}
				} );
				newState.set(
					'',
					( state.get( '' ) ?? [] ).concat( blockOrder[ '' ] )
				);
				return newState;
			}
			case 'INSERT_BLOCKS': {
				const { rootClientId = '' } = action;
				const subState = state.get( rootClientId ) || [];
				const mappedBlocks = mapBlockOrder(
					action.blocks,
					rootClientId
				);
				const { index = subState.length } = action;
				const newState = new Map( state );
				mappedBlocks.forEach( ( order, clientId ) => {
					newState.set( clientId, order );
				} );
				newState.set(
					rootClientId,
					insertAt(
						subState,
						mappedBlocks.get( rootClientId ),
						index
					)
				);
				return newState;
			}

			case 'MOVE_BLOCKS_TO_POSITION': {
				const {
					fromRootClientId = '',
					toRootClientId = '',
					clientIds,
				} = action;
				const { index = state.get( toRootClientId ).length } = action;

				// Moving inside the same parent block.
				if ( fromRootClientId === toRootClientId ) {
					const subState = state.get( toRootClientId );
					const fromIndex = subState.indexOf( clientIds[ 0 ] );
					const newState = new Map( state );
					newState.set(
						toRootClientId,
						moveTo(
							state.get( toRootClientId ),
							fromIndex,
							index,
							clientIds.length
						)
					);
					return newState;
				}

				// Moving from a parent block to another.
				const newState = new Map( state );
				newState.set(
					fromRootClientId,
					state
						.get( fromRootClientId )
						?.filter( ( id ) => ! clientIds.includes( id ) ) ?? []
				);
				newState.set(
					toRootClientId,
					insertAt( state.get( toRootClientId ), clientIds, index )
				);
				return newState;
			}

			case 'MOVE_BLOCKS_UP': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = clientIds[ 0 ];
				const subState = state.get( rootClientId );

				if ( ! subState.length || firstClientId === subState[ 0 ] ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );
				const newState = new Map( state );
				newState.set(
					rootClientId,
					moveTo(
						subState,
						firstIndex,
						firstIndex - 1,
						clientIds.length
					)
				);
				return newState;
			}

			case 'MOVE_BLOCKS_DOWN': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = clientIds[ 0 ];
				const lastClientId = clientIds[ clientIds.length - 1 ];
				const subState = state.get( rootClientId );

				if (
					! subState.length ||
					lastClientId === subState[ subState.length - 1 ]
				) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );
				const newState = new Map( state );
				newState.set(
					rootClientId,
					moveTo(
						subState,
						firstIndex,
						firstIndex + 1,
						clientIds.length
					)
				);
				return newState;
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const { clientIds } = action;
				if ( ! action.blocks ) {
					return state;
				}

				const mappedBlocks = mapBlockOrder( action.blocks );
				const newState = new Map( state );
				action.replacedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				mappedBlocks.forEach( ( order, clientId ) => {
					if ( clientId !== '' ) {
						newState.set( clientId, order );
					}
				} );
				newState.forEach( ( order, clientId ) => {
					const newSubOrder = Object.values( order ).reduce(
						( result, subClientId ) => {
							if ( subClientId === clientIds[ 0 ] ) {
								return [ ...result, ...mappedBlocks.get( '' ) ];
							}

							if ( clientIds.indexOf( subClientId ) === -1 ) {
								result.push( subClientId );
							}

							return result;
						},
						[]
					);
					newState.set( clientId, newSubOrder );
				} );
				return newState;
			}

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const newState = new Map( state );
				// Remove inner block ordering for removed blocks.
				action.removedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				newState.forEach( ( order, clientId ) => {
					const newSubOrder =
						order?.filter(
							( id ) => ! action.removedClientIds.includes( id )
						) ?? [];
					if ( newSubOrder.length !== order.length ) {
						newState.set( clientId, newSubOrder );
					}
				} );
				return newState;
			}
		}

		return state;
	},

	// While technically redundant data as the inverse of `order`, it serves as
	// an optimization for the selectors which derive the ancestry of a block.
	parents( state = new Map(), action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS': {
				const newState = new Map( state );
				mapBlockParents( action.blocks ).forEach(
					( [ key, value ] ) => {
						newState.set( key, value );
					}
				);
				return newState;
			}
			case 'INSERT_BLOCKS': {
				const newState = new Map( state );
				mapBlockParents(
					action.blocks,
					action.rootClientId || ''
				).forEach( ( [ key, value ] ) => {
					newState.set( key, value );
				} );
				return newState;
			}
			case 'MOVE_BLOCKS_TO_POSITION': {
				const newState = new Map( state );
				action.clientIds.forEach( ( id ) => {
					newState.set( id, action.toRootClientId || '' );
				} );
				return newState;
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const newState = new Map( state );
				action.replacedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				mapBlockParents(
					action.blocks,
					state.get( action.clientIds[ 0 ] )
				).forEach( ( [ key, value ] ) => {
					newState.set( key, value );
				} );
				return newState;
			}
			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const newState = new Map( state );
				action.removedClientIds.forEach( ( clientId ) => {
					newState.delete( clientId );
				} );
				return newState;
			}
		}

		return state;
	},

	controlledInnerBlocks(
		state = {},
		{ type, clientId, hasControlledInnerBlocks }
	) {
		if ( type === 'SET_HAS_CONTROLLED_INNER_BLOCKS' ) {
			return {
				...state,
				[ clientId ]: hasControlledInnerBlocks,
			};
		}
		return state;
	},
} );

/**
 * Reducer returning visibility status of block interface.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isBlockInterfaceHidden( state = false, action ) {
	switch ( action.type ) {
		case 'HIDE_BLOCK_INTERFACE':
			return true;

		case 'SHOW_BLOCK_INTERFACE':
			return false;
	}

	return state;
}

/**
 * Reducer returning typing state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isTyping( state = false, action ) {
	switch ( action.type ) {
		case 'START_TYPING':
			return true;

		case 'STOP_TYPING':
			return false;
	}

	return state;
}

/**
 * Reducer returning dragging state. It is possible for a user to be dragging
 * data from outside of the editor, so this state is separate from `draggedBlocks`.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isDragging( state = false, action ) {
	switch ( action.type ) {
		case 'START_DRAGGING':
			return true;

		case 'STOP_DRAGGING':
			return false;
	}

	return state;
}

/**
 * Reducer returning dragged block client id.
 *
 * @param {string[]} state  Current state.
 * @param {Object}   action Dispatched action.
 *
 * @return {string[]} Updated state.
 */
export function draggedBlocks( state = [], action ) {
	switch ( action.type ) {
		case 'START_DRAGGING_BLOCKS':
			return action.clientIds;

		case 'STOP_DRAGGING_BLOCKS':
			return [];
	}

	return state;
}

/**
 * Reducer tracking the visible blocks.
 *
 * @param {Record<string,boolean>} state  Current state.
 * @param {Object}                 action Dispatched action.
 *
 * @return {Record<string,boolean>} Block visibility.
 */
export function blockVisibility( state = {}, action ) {
	if ( action.type === 'SET_BLOCK_VISIBILITY' ) {
		return {
			...state,
			...action.updates,
		};
	}

	return state;
}

/**
 * Internal helper reducer for selectionStart and selectionEnd. Can hold a block
 * selection, represented by an object with property clientId.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
function selectionHelper( state = {}, action ) {
	switch ( action.type ) {
		case 'CLEAR_SELECTED_BLOCK': {
			if ( state.clientId ) {
				return {};
			}

			return state;
		}
		case 'SELECT_BLOCK':
			if ( action.clientId === state.clientId ) {
				return state;
			}

			return { clientId: action.clientId };
		case 'REPLACE_INNER_BLOCKS':
		case 'INSERT_BLOCKS': {
			if ( ! action.updateSelection || ! action.blocks.length ) {
				return state;
			}

			return { clientId: action.blocks[ 0 ].clientId };
		}
		case 'REMOVE_BLOCKS':
			if (
				! action.clientIds ||
				! action.clientIds.length ||
				action.clientIds.indexOf( state.clientId ) === -1
			) {
				return state;
			}

			return {};
		case 'REPLACE_BLOCKS': {
			if ( action.clientIds.indexOf( state.clientId ) === -1 ) {
				return state;
			}

			const blockToSelect =
				action.blocks[ action.indexToSelect ] ||
				action.blocks[ action.blocks.length - 1 ];

			if ( ! blockToSelect ) {
				return {};
			}

			if ( blockToSelect.clientId === state.clientId ) {
				return state;
			}

			return { clientId: blockToSelect.clientId };
		}
	}

	return state;
}

/**
 * Reducer returning the selection state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function selection( state = {}, action ) {
	switch ( action.type ) {
		case 'SELECTION_CHANGE':
			if ( action.clientId ) {
				return {
					selectionStart: {
						clientId: action.clientId,
						attributeKey: action.attributeKey,
						offset: action.startOffset,
					},
					selectionEnd: {
						clientId: action.clientId,
						attributeKey: action.attributeKey,
						offset: action.endOffset,
					},
				};
			}

			return {
				selectionStart: action.start || state.selectionStart,
				selectionEnd: action.end || state.selectionEnd,
			};
		case 'RESET_SELECTION':
			const { selectionStart, selectionEnd } = action;
			return {
				selectionStart,
				selectionEnd,
			};
		case 'MULTI_SELECT':
			const { start, end } = action;

			if (
				start === state.selectionStart?.clientId &&
				end === state.selectionEnd?.clientId
			) {
				return state;
			}

			return {
				selectionStart: { clientId: start },
				selectionEnd: { clientId: end },
			};
		case 'RESET_BLOCKS':
			const startClientId = state?.selectionStart?.clientId;
			const endClientId = state?.selectionEnd?.clientId;

			// Do nothing if there's no selected block.
			if ( ! startClientId && ! endClientId ) {
				return state;
			}

			// If the start of the selection won't exist after reset, remove selection.
			if (
				! action.blocks.some(
					( block ) => block.clientId === startClientId
				)
			) {
				return {
					selectionStart: {},
					selectionEnd: {},
				};
			}

			// If the end of the selection won't exist after reset, collapse selection.
			if (
				! action.blocks.some(
					( block ) => block.clientId === endClientId
				)
			) {
				return {
					...state,
					selectionEnd: state.selectionStart,
				};
			}
	}

	const selectionStart = selectionHelper( state.selectionStart, action );
	const selectionEnd = selectionHelper( state.selectionEnd, action );

	if (
		selectionStart === state.selectionStart &&
		selectionEnd === state.selectionEnd
	) {
		return state;
	}

	return {
		selectionStart,
		selectionEnd,
	};
}

/**
 * Reducer returning whether the user is multi-selecting.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isMultiSelecting( state = false, action ) {
	switch ( action.type ) {
		case 'START_MULTI_SELECT':
			return true;

		case 'STOP_MULTI_SELECT':
			return false;
	}

	return state;
}

/**
 * Reducer returning whether selection is enabled.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isSelectionEnabled( state = true, action ) {
	switch ( action.type ) {
		case 'TOGGLE_SELECTION':
			return action.isSelectionEnabled;
	}

	return state;
}

/**
 * Reducer returning the data needed to display a prompt when certain blocks
 * are removed, or `false` if no such prompt is requested.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {Object|false} Data for removal prompt display, if any.
 */
function removalPromptData( state = false, action ) {
	switch ( action.type ) {
		case 'DISPLAY_BLOCK_REMOVAL_PROMPT':
			const { clientIds, selectPrevious, message } = action;
			return {
				clientIds,
				selectPrevious,
				message,
			};
		case 'CLEAR_BLOCK_REMOVAL_PROMPT':
			return false;
	}

	return state;
}

/**
 * Reducer returning any rules that a block editor may provide in order to
 * prevent a user from accidentally removing certain blocks. These rules are
 * then used to display a confirmation prompt to the user. For instance, in the
 * Site Editor, the Query Loop block is important enough to warrant such
 * confirmation.
 *
 * The data is a record whose keys are block types (e.g. 'core/query') and
 * whose values are the explanation to be shown to users (e.g. 'Query Loop
 * displays a list of posts or pages.').
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {Record<string,string>} Updated state.
 */
function blockRemovalRules( state = false, action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_REMOVAL_RULES':
			return action.rules;
	}

	return state;
}

/**
 * Reducer returning the initial block selection.
 *
 * Currently this in only used to restore the selection after block deletion and
 * pasting new content.This reducer should eventually be removed in favour of setting
 * selection directly.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {number|null} Initial position: 0, -1 or null.
 */
export function initialPosition( state = null, action ) {
	if (
		action.type === 'REPLACE_BLOCKS' &&
		action.initialPosition !== undefined
	) {
		return action.initialPosition;
	} else if (
		[
			'MULTI_SELECT',
			'SELECT_BLOCK',
			'RESET_SELECTION',
			'INSERT_BLOCKS',
			'REPLACE_INNER_BLOCKS',
		].includes( action.type )
	) {
		return action.initialPosition;
	}

	return state;
}

export function blocksMode( state = {}, action ) {
	if ( action.type === 'TOGGLE_BLOCK_MODE' ) {
		const { clientId } = action;
		return {
			...state,
			[ clientId ]:
				state[ clientId ] && state[ clientId ] === 'html'
					? 'visual'
					: 'html',
		};
	}

	return state;
}

/**
 * Reducer returning the block insertion point visibility, either null if there
 * is not an explicit insertion point assigned, or an object of its `index` and
 * `rootClientId`.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function insertionCue( state = null, action ) {
	switch ( action.type ) {
		case 'SHOW_INSERTION_POINT': {
			const {
				rootClientId,
				index,
				__unstableWithInserter,
				operation,
				nearestSide,
			} = action;
			const nextState = {
				rootClientId,
				index,
				__unstableWithInserter,
				operation,
				nearestSide,
			};

			// Bail out updates if the states are the same.
			return fastDeepEqual( state, nextState ) ? state : nextState;
		}

		case 'HIDE_INSERTION_POINT':
			return null;
	}

	return state;
}

/**
 * Reducer returning whether the post blocks match the defined template or not.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function template( state = { isValid: true }, action ) {
	switch ( action.type ) {
		case 'SET_TEMPLATE_VALIDITY':
			return {
				...state,
				isValid: action.isValid,
			};
	}

	return state;
}

/**
 * Reducer returning the editor setting.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function settings( state = SETTINGS_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'UPDATE_SETTINGS': {
			const updatedSettings = action.reset
				? {
						...SETTINGS_DEFAULTS,
						...action.settings,
				  }
				: {
						...state,
						...action.settings,
				  };

			Object.defineProperty( updatedSettings, '__unstableIsPreviewMode', {
				get() {
					deprecated( '__unstableIsPreviewMode', {
						since: '6.8',
						alternative: 'isPreviewMode',
					} );

					return this.isPreviewMode;
				},
			} );

			return updatedSettings;
		}
	}

	return state;
}

/**
 * Reducer returning the user preferences.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function preferences( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'INSERT_BLOCKS':
		case 'REPLACE_BLOCKS': {
			const nextInsertUsage = action.blocks.reduce(
				( prevUsage, block ) => {
					const { attributes, name: blockName } = block;
					let id = blockName;
					// If a block variation match is found change the name to be the same with the
					// one that is used for block variations in the Inserter (`getItemFromVariation`).
					const match = select( blocksStore ).getActiveBlockVariation(
						blockName,
						attributes
					);
					if ( match?.name ) {
						id += '/' + match.name;
					}
					if ( blockName === 'core/block' ) {
						id += '/' + attributes.ref;
					}

					return {
						...prevUsage,
						[ id ]: {
							time: action.time,
							count: prevUsage[ id ]
								? prevUsage[ id ].count + 1
								: 1,
						},
					};
				},
				state.insertUsage
			);

			return {
				...state,
				insertUsage: nextInsertUsage,
			};
		}
	}

	return state;
}

/**
 * Reducer returning an object where each key is a block client ID, its value
 * representing the settings for its nested blocks.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export const blockListSettings = ( state = {}, action ) => {
	switch ( action.type ) {
		// Even if the replaced blocks have the same client ID, our logic
		// should correct the state.
		case 'REPLACE_BLOCKS':
		case 'REMOVE_BLOCKS': {
			return Object.fromEntries(
				Object.entries( state ).filter(
					( [ id ] ) => ! action.clientIds.includes( id )
				)
			);
		}
		case 'UPDATE_BLOCK_LIST_SETTINGS': {
			const updates =
				typeof action.clientId === 'string'
					? { [ action.clientId ]: action.settings }
					: action.clientId;

			// Remove settings that are the same as the current state.
			for ( const clientId in updates ) {
				if ( ! updates[ clientId ] ) {
					if ( ! state[ clientId ] ) {
						delete updates[ clientId ];
					}
				} else if (
					fastDeepEqual( state[ clientId ], updates[ clientId ] )
				) {
					delete updates[ clientId ];
				}
			}

			if ( Object.keys( updates ).length === 0 ) {
				return state;
			}

			const merged = { ...state, ...updates };

			for ( const clientId in updates ) {
				if ( ! updates[ clientId ] ) {
					delete merged[ clientId ];
				}
			}

			return merged;
		}
	}
	return state;
};

/**
 * Reducer return an updated state representing the most recent block attribute
 * update. The state is structured as an object where the keys represent the
 * client IDs of blocks, the values a subset of attributes from the most recent
 * block update. The state is always reset to null if the last action is
 * anything other than an attributes update.
 *
 * @param {Object<string,Object>} state  Current state.
 * @param {Object}                action Action object.
 *
 * @return {[string,Object]} Updated state.
 */
export function lastBlockAttributesChange( state = null, action ) {
	switch ( action.type ) {
		case 'UPDATE_BLOCK':
			if ( ! action.updates.attributes ) {
				break;
			}

			return { [ action.clientId ]: action.updates.attributes };

		case 'UPDATE_BLOCK_ATTRIBUTES':
			return action.clientIds.reduce(
				( accumulator, id ) => ( {
					...accumulator,
					[ id ]: !! action.options?.uniqueByBlock
						? action.attributes[ id ]
						: action.attributes,
				} ),
				{}
			);
	}

	return state;
}

/**
 * Reducer returning current highlighted block.
 *
 * @param {boolean} state  Current highlighted block.
 * @param {Object}  action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function highlightedBlock( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_HIGHLIGHT':
			const { clientId, isHighlighted } = action;

			if ( isHighlighted ) {
				return clientId;
			} else if ( state === clientId ) {
				return null;
			}

			return state;
		case 'SELECT_BLOCK':
			if ( action.clientId !== state ) {
				return null;
			}
	}

	return state;
}

/**
 * Reducer returning current spotlighted block.
 *
 * @param {string|null} state  Current clientId or null.
 * @param {Object}      action Dispatched action.
 *
 * @return {string|null} Updated state.
 */
export function hasBlockSpotlight( state, action ) {
	switch ( action.type ) {
		case 'TOGGLE_BLOCK_SPOTLIGHT':
			const { clientId, hasBlockSpotlight: _hasBlockSpotlight } = action;

			if ( _hasBlockSpotlight ) {
				return clientId;
			} else if ( state === clientId ) {
				return null;
			}
			return state;
		case 'SELECT_BLOCK':
			if ( action.clientId !== state ) {
				return null;
			}
			return state;
		case 'SELECTION_CHANGE':
			if (
				action.start?.clientId !== state ||
				action.end?.clientId !== state
			) {
				return null;
			}
			return state;
		case 'CLEAR_SELECTED_BLOCK':
			return null;
	}

	return state;
}

/**
 * Reducer returning current expanded block in the list view.
 *
 * @param {string|null} state  Current expanded block.
 * @param {Object}      action Dispatched action.
 *
 * @return {string|null} Updated state.
 */
export function expandedBlock( state = null, action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_EXPANDED_IN_LIST_VIEW':
			return action.clientId;
		case 'SELECT_BLOCK':
			if ( action.clientId !== state ) {
				return null;
			}
	}

	return state;
}

/**
 * Reducer returning the block insertion event list state.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function lastBlockInserted( state = {}, action ) {
	switch ( action.type ) {
		case 'INSERT_BLOCKS':
		case 'REPLACE_BLOCKS':
			if ( ! action.blocks.length ) {
				return state;
			}

			const clientIds = action.blocks.map( ( block ) => {
				return block.clientId;
			} );

			const source = action.meta?.source;

			return { clientIds, source };
		case 'RESET_BLOCKS':
			return {};
	}
	return state;
}

/**
 * Reducer returning the contentOnly block that is being edited.
 *
 * @param {string|undefined} state  Current state.
 * @param {Object}           action Dispatched action.
 *
 * @return {string|undefined} Updated state.
 */
export function editedContentOnlySection( state, action ) {
	if ( action.type === 'EDIT_CONTENT_ONLY_SECTION' ) {
		return action.clientId;
	}
	return state;
}

/**
 * Reducer returning a map of block client IDs to block editing modes.
 *
 * @param {Map}    state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Map} Updated state.
 */
export function blockEditingModes( state = new Map(), action ) {
	switch ( action.type ) {
		case 'SET_BLOCK_EDITING_MODE':
			if ( state.get( action.clientId ) === action.mode ) {
				return state;
			}
			return new Map( state ).set( action.clientId, action.mode );
		case 'UNSET_BLOCK_EDITING_MODE': {
			if ( ! state.has( action.clientId ) ) {
				return state;
			}
			const newState = new Map( state );
			newState.delete( action.clientId );
			return newState;
		}
		case 'RESET_BLOCKS': {
			return state.has( '' )
				? new Map().set( '', state.get( '' ) )
				: state;
		}
	}
	return state;
}

/**
 * Reducer returning the clientId of the block settings menu that is currently open.
 *
 * @param {string|null} state  Current state.
 * @param {Object}      action Dispatched action.
 *
 * @return {string|null} Updated state.
 */
export function openedBlockSettingsMenu( state = null, action ) {
	if ( 'SET_OPENED_BLOCK_SETTINGS_MENU' === action.type ) {
		return action?.clientId ?? null;
	}
	return state;
}

/**
 * Reducer returning a map of style IDs to style overrides.
 *
 * @param {Map}    state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Map} Updated state.
 */
export function styleOverrides( state = new Map(), action ) {
	switch ( action.type ) {
		case 'SET_STYLE_OVERRIDE':
			return new Map( state ).set( action.id, action.style );
		case 'DELETE_STYLE_OVERRIDE': {
			const newState = new Map( state );
			newState.delete( action.id );
			return newState;
		}
	}
	return state;
}

/**
 * Reducer returning a map of the registered inserter media categories.
 *
 * @param {Array}  state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Array} Updated state.
 */
export function registeredInserterMediaCategories( state = [], action ) {
	switch ( action.type ) {
		case 'REGISTER_INSERTER_MEDIA_CATEGORY':
			return [ ...state, action.category ];
	}

	return state;
}

/**
 * Reducer setting last focused element
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function lastFocus( state = false, action ) {
	switch ( action.type ) {
		case 'LAST_FOCUS':
			return action.lastFocus;
	}

	return state;
}

/**
 * Reducer setting zoom out state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {number} Updated state.
 */
export function zoomLevel( state = 100, action ) {
	switch ( action.type ) {
		case 'SET_ZOOM_LEVEL':
			return action.zoom;
		case 'RESET_ZOOM_LEVEL':
			return 100;
	}

	return state;
}

/**
 * Reducer setting the insertion point
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function insertionPoint( state = null, action ) {
	switch ( action.type ) {
		case 'SET_INSERTION_POINT':
			return action.value;
		case 'SELECT_BLOCK':
			return null;
	}

	return state;
}

const combinedReducers = combineReducers( {
	blocks,
	isDragging,
	isTyping,
	isBlockInterfaceHidden,
	draggedBlocks,
	selection,
	isMultiSelecting,
	isSelectionEnabled,
	initialPosition,
	blocksMode,
	blockListSettings,
	insertionPoint,
	insertionCue,
	template,
	settings,
	preferences,
	lastBlockAttributesChange,
	lastFocus,
	expandedBlock,
	highlightedBlock,
	lastBlockInserted,
	editedContentOnlySection,
	blockVisibility,
	blockEditingModes,
	styleOverrides,
	removalPromptData,
	blockRemovalRules,
	openedBlockSettingsMenu,
	registeredInserterMediaCategories,
	zoomLevel,
	hasBlockSpotlight,
} );

/**
 * Retrieves a block's tree structure, handling both controlled and uncontrolled inner blocks.
 *
 * @param {Object} state    The current state object.
 * @param {string} clientId The client ID of the block to retrieve.
 *
 * @return {Object|undefined} The block tree object, or undefined if not found. For controlled blocks,
 *                           returns a merged tree with controlled inner blocks.
 */
function getBlockTreeBlock( state, clientId ) {
	if ( clientId === '' ) {
		const rootBlock = state.blocks.tree.get( clientId );

		if ( ! rootBlock ) {
			return;
		}

		// Patch the root block to have a clientId property.
		// TODO - consider updating the blocks reducer so that the root block has this property.
		return {
			clientId: '',
			...rootBlock,
		};
	}

	if ( ! state.blocks.controlledInnerBlocks[ clientId ] ) {
		return state.blocks.tree.get( clientId );
	}

	const controlledTree = state.blocks.tree.get( `controlled||${ clientId }` );
	const regularTree = state.blocks.tree.get( clientId );

	return {
		...regularTree,
		innerBlocks: controlledTree?.innerBlocks,
	};
}

/**
 * Recursively traverses through a block tree of a given block and executes a callback for each block.
 *
 * @param {Object}   state    The store state.
 * @param {string}   clientId The clientId of the block to start traversing from.
 * @param {Function} callback Function to execute for each block encountered during traversal.
 *                            The callback receives the current block as its argument.
 */
function traverseBlockTree( state, clientId, callback ) {
	const tree = getBlockTreeBlock( state, clientId );
	if ( ! tree ) {
		return;
	}

	callback( tree );

	if ( ! tree?.innerBlocks?.length ) {
		return;
	}

	for ( const innerBlock of tree?.innerBlocks ) {
		traverseBlockTree( state, innerBlock.clientId, callback );
	}
}

/**
 * Checks if a block has a parent in a list of client IDs, and if so returns the client ID of the parent.
 *
 * @param {Object} state     The current state object.
 * @param {string} clientId  The client ID of the block to search the parents of.
 * @param {Array}  clientIds The client IDs of the blocks to check.
 *
 * @return {string|undefined} The client ID of the parent block if found, undefined otherwise.
 */
function findParentInClientIdsList( state, clientId, clientIds ) {
	if ( ! clientIds.length ) {
		return;
	}

	let parent = state.blocks.parents.get( clientId );
	while ( parent !== undefined ) {
		if ( clientIds.includes( parent ) ) {
			return parent;
		}
		parent = state.blocks.parents.get( parent );
	}
}

/**
 * Checks if a block has any bindings in its metadata attributes.
 *
 * @param {Object} block The block object to check for bindings.
 * @return {boolean}    True if the block has bindings, false otherwise.
 */
function hasBindings( block ) {
	return (
		block?.attributes?.metadata?.bindings &&
		Object.keys( block?.attributes?.metadata?.bindings ).length
	);
}

/**
 * Computes and returns derived block editing modes for a given block tree.
 *
 * This function calculates the editing modes for each block in the tree, taking into account
 * various factors such as zoom level, sections, and synced patterns.
 *
 * @param {Object} state        The current state object.
 * @param {string} treeClientId The client ID of the root block for the tree. Defaults to an empty string.
 * @return {Map} A Map containing the derived block editing modes, keyed by block client ID.
 */
function getDerivedBlockEditingModesForTree( state, treeClientId = '' ) {
	const isZoomedOut =
		state?.zoomLevel < 100 || state?.zoomLevel === 'auto-scaled';
	const derivedBlockEditingModes = new Map();

	// When there are sections, the majority of blocks are disabled,
	// so the default block editing mode is set to disabled.
	const sectionRootClientId = state.settings?.[ sectionRootClientIdKey ];
	const sectionClientIds = state.blocks.order.get( sectionRootClientId );
	const hasDisabledBlocks = Array.from( state.blockEditingModes ).some(
		( [ , mode ] ) => mode === 'disabled'
	);
	const templatePartClientIds = [];
	const syncedPatternClientIds = [];

	Object.keys( state.blocks.controlledInnerBlocks ).forEach( ( clientId ) => {
		const block = state.blocks.byClientId?.get( clientId );

		if ( block?.name === 'core/template-part' ) {
			templatePartClientIds.push( clientId );
		}

		if ( block?.name === 'core/block' ) {
			syncedPatternClientIds.push( clientId );
		}
	} );
	const contentOnlyTemplateLockedClientIds = Object.keys(
		state.blockListSettings
	).filter(
		( clientId ) =>
			state.blockListSettings[ clientId ]?.templateLock === 'contentOnly'
	);
	// Use array.from for better back compat. Older versions of the iterator returned
	// from `keys()` didn't have the `filter` method.
	const unsyncedPatternClientIds =
		!! window?.__experimentalContentOnlyPatternInsertion
			? Array.from( state.blocks.attributes.keys() ).filter(
					( clientId ) =>
						state.blocks.attributes.get( clientId )?.metadata
							?.patternName
			  )
			: [];
	const contentOnlyParents = [
		...contentOnlyTemplateLockedClientIds,
		...unsyncedPatternClientIds,
		...( window?.__experimentalContentOnlyPatternInsertion
			? templatePartClientIds
			: [] ),
	];

	traverseBlockTree( state, treeClientId, ( block ) => {
		const { clientId, name: blockName } = block;

		// Set the edited section and all blocks within it to 'default', so that all changes can be made.
		if ( state.editedContentOnlySection ) {
			// If this is the edited section, use the default mode.
			if ( state.editedContentOnlySection === clientId ) {
				derivedBlockEditingModes.set( clientId, 'default' );
				return;
			}

			// If the block is within the edited section also use the default mode.
			const parentTempEditedClientId = findParentInClientIdsList(
				state,
				clientId,
				[ state.editedContentOnlySection ]
			);
			if ( parentTempEditedClientId ) {
				derivedBlockEditingModes.set( clientId, 'default' );
				return;
			}

			// For the content only pattern experiment, disable blocks that are outside of the edited section.
			if ( window?.__experimentalContentOnlyPatternInsertion ) {
				derivedBlockEditingModes.set( clientId, 'disabled' );
				return;
			}
		}

		// If the block already has an explicit block editing mode set,
		// don't override it.
		if ( state.blockEditingModes.has( clientId ) ) {
			return;
		}

		// Disabled explicit block editing modes are inherited by children.
		// It's an expensive calculation, so only do it if there are disabled blocks.
		if ( hasDisabledBlocks ) {
			// Look through parents to find one with an explicit block editing mode.
			let ancestorBlockEditingMode;
			let parent = state.blocks.parents.get( clientId );
			while ( parent !== undefined ) {
				if ( state.blockEditingModes.has( parent ) ) {
					// Checking the explicit block editing mode will be slower,
					// as the block editing mode is more likely to be set on a
					// distant ancestor.
					ancestorBlockEditingMode =
						state.blockEditingModes.get( parent );
				}
				if ( ancestorBlockEditingMode ) {
					break;
				}
				parent = state.blocks.parents.get( parent );
			}

			// If the ancestor block editing mode is disabled, it's inherited by the child.
			if ( ancestorBlockEditingMode === 'disabled' ) {
				derivedBlockEditingModes.set( clientId, 'disabled' );
				return;
			}
		}

		if ( isZoomedOut ) {
			// If the root block is the section root set its editing mode to contentOnly.
			if ( clientId === sectionRootClientId ) {
				derivedBlockEditingModes.set( clientId, 'contentOnly' );
				return;
			}

			// There are no sections, so everything else is disabled.
			if ( ! sectionClientIds?.length ) {
				derivedBlockEditingModes.set( clientId, 'disabled' );
				return;
			}

			if ( sectionClientIds.includes( clientId ) ) {
				derivedBlockEditingModes.set( clientId, 'contentOnly' );
				return;
			}

			// If zoomed out, all blocks that aren't sections or the section root are
			// disabled.
			derivedBlockEditingModes.set( clientId, 'disabled' );
			return;
		}

		if ( syncedPatternClientIds.length ) {
			// Synced pattern blocks (core/block).
			if ( syncedPatternClientIds.includes( clientId ) ) {
				// This is a pattern nested in another pattern, it should be disabled.
				if (
					findParentInClientIdsList(
						state,
						clientId,
						syncedPatternClientIds
					)
				) {
					derivedBlockEditingModes.set( clientId, 'disabled' );
					return;
				}

				// Else do nothing, use the default block editing mode.
				return;
			}

			// Inner blocks of synced patterns.
			const parentPatternClientId = findParentInClientIdsList(
				state,
				clientId,
				syncedPatternClientIds
			);
			if ( parentPatternClientId ) {
				// This is a pattern nested in another pattern, it should be disabled.
				if (
					findParentInClientIdsList(
						state,
						parentPatternClientId,
						syncedPatternClientIds
					)
				) {
					derivedBlockEditingModes.set( clientId, 'disabled' );
					return;
				}

				if ( hasBindings( block ) ) {
					derivedBlockEditingModes.set( clientId, 'contentOnly' );
					return;
				}

				// Synced pattern content without a binding isn't editable
				// from the instance, the user has to edit the pattern source,
				// so return 'disabled'.
				derivedBlockEditingModes.set( clientId, 'disabled' );
			}
		}

		// Handle `templateLock=contentOnly` blocks and unsynced patterns.
		if ( contentOnlyParents.length ) {
			const hasContentOnlyParent = !! findParentInClientIdsList(
				state,
				clientId,
				contentOnlyParents
			);
			if ( hasContentOnlyParent ) {
				if ( isContentBlock( blockName ) ) {
					derivedBlockEditingModes.set( clientId, 'contentOnly' );
				} else {
					derivedBlockEditingModes.set( clientId, 'disabled' );
				}
			}
		}
	} );

	return derivedBlockEditingModes;
}

/**
 * Updates the derived block editing modes based on added and removed blocks.
 *
 * This function handles the updating of block editing modes when blocks are added,
 * removed, or moved within the editor.
 *
 * It only returns a value when modifications are made to the block editing modes.
 *
 * @param {Object} options                    The options for updating derived block editing modes.
 * @param {Object} options.prevState          The previous state object.
 * @param {Object} options.nextState          The next state object.
 * @param {Array}  [options.addedBlocks]      An array of blocks that were added.
 * @param {Array}  [options.removedClientIds] An array of client IDs of blocks that were removed.
 * @return {Map|undefined} The updated derived block editing modes, or undefined if no changes were made.
 */
function getDerivedBlockEditingModesUpdates( {
	prevState,
	nextState,
	addedBlocks,
	removedClientIds,
} ) {
	const prevDerivedBlockEditingModes = prevState.derivedBlockEditingModes;
	let nextDerivedBlockEditingModes;

	// Perform removals before additions to handle cases like the `MOVE_BLOCKS_TO_POSITION` action.
	// That action removes a set of clientIds, but adds the same blocks back in a different location.
	// If removals were performed after additions, those moved clientIds would be removed incorrectly.
	removedClientIds?.forEach( ( clientId ) => {
		// The actions only receive parent block IDs for removal.
		// Recurse through the block tree to ensure all blocks are removed.
		// Specifically use the previous state, before the blocks were removed.
		traverseBlockTree( prevState, clientId, ( block ) => {
			if ( prevDerivedBlockEditingModes.has( block.clientId ) ) {
				if ( ! nextDerivedBlockEditingModes ) {
					nextDerivedBlockEditingModes = new Map(
						prevDerivedBlockEditingModes
					);
				}
				nextDerivedBlockEditingModes.delete( block.clientId );
			}
		} );
	} );

	addedBlocks?.forEach( ( addedBlock ) => {
		const updates = getDerivedBlockEditingModesForTree(
			nextState,
			addedBlock.clientId
		);

		if ( updates.size ) {
			if ( ! nextDerivedBlockEditingModes ) {
				nextDerivedBlockEditingModes = new Map( [
					...( prevDerivedBlockEditingModes?.size
						? prevDerivedBlockEditingModes
						: [] ),
					...updates,
				] );
			} else {
				nextDerivedBlockEditingModes = new Map( [
					...( nextDerivedBlockEditingModes?.size
						? nextDerivedBlockEditingModes
						: [] ),
					...updates,
				] );
			}
		}
	} );

	return nextDerivedBlockEditingModes;
}

/**
 * Higher-order reducer that adds derived block editing modes to the state.
 *
 * This function wraps a reducer and enhances it to handle actions that affect
 * block editing modes. It updates the derivedBlockEditingModes in the state
 * based on various actions such as adding, removing, or moving blocks, or changing
 * the editor mode.
 *
 * @param {Function} reducer The original reducer function to be wrapped.
 * @return {Function} A new reducer function that includes derived block editing modes handling.
 */
export function withDerivedBlockEditingModes( reducer ) {
	return ( state, action ) => {
		const nextState = reducer( state, action );

		// An exception is needed here to still recompute the block editing modes when
		// the editor mode changes since the editor mode isn't stored within the
		// block editor state and changing it won't trigger an altered new state.
		if ( action.type !== 'SET_EDITOR_MODE' && nextState === state ) {
			return state;
		}

		switch ( action.type ) {
			case 'REMOVE_BLOCKS': {
				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						removedClientIds: action.clientIds,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS': {
				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks: action.blocks,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'UPDATE_BLOCK_ATTRIBUTES': {
				// Handle unsynced patterns which indicate their contentOnly-ness via
				// the `attributes.metadata.patternName` property.
				// Check when this is added or removed and update blockEditingModes.
				const addedBlocks = [];
				const removedClientIds = [];

				for ( const clientId of action?.clientIds ) {
					const attributes = action.options?.uniqueByBlock
						? action.attributes[ clientId ]
						: action.attributes;

					if ( ! attributes ) {
						break;
					}

					if (
						// patternName is switching from falsy to truthy, indicating
						// this block is becoming an unsynced pattern.
						attributes.metadata?.patternName &&
						! state.blocks.attributes.get( clientId )?.metadata
							?.patternName
					) {
						addedBlocks.push(
							nextState.blocks.tree.get( clientId )
						);
					} else if (
						// patternName is switching from truthy to falsy, this block is becoming
						// a regular block but was an unsynced pattern.
						// Check that `metadata` is part of the included attributes, as
						// `updateBlockAttributes` merges attributes, if it isn't present
						// the previous `metadata` would be retained.
						attributes.metadata &&
						! attributes.metadata?.patternName &&
						state.blocks.attributes.get( clientId )?.metadata
							?.patternName
					) {
						// Include it in 'removedClientIds'.
						removedClientIds.push( clientId );
					}
				}

				if ( ! addedBlocks?.length && ! removedClientIds?.length ) {
					break;
				}

				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks,
						removedClientIds,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}

				break;
			}
			case 'UPDATE_BLOCK_LIST_SETTINGS': {
				// Handle the addition and removal of contentOnly template locked blocks.
				const addedBlocks = [];
				const removedClientIds = [];

				const updates =
					typeof action.clientId === 'string'
						? { [ action.clientId ]: action.settings }
						: action.clientId;

				for ( const clientId in updates ) {
					const isNewContentOnlyBlock =
						state.blockListSettings[ clientId ]?.templateLock !==
							'contentOnly' &&
						nextState.blockListSettings[ clientId ]
							?.templateLock === 'contentOnly';

					const wasContentOnlyBlock =
						state.blockListSettings[ clientId ]?.templateLock ===
							'contentOnly' &&
						nextState.blockListSettings[ clientId ]
							?.templateLock !== 'contentOnly';

					if ( isNewContentOnlyBlock ) {
						addedBlocks.push(
							nextState.blocks.tree.get( clientId )
						);
					} else if ( wasContentOnlyBlock ) {
						removedClientIds.push( clientId );
					}
				}

				if ( ! addedBlocks.length && ! removedClientIds.length ) {
					break;
				}

				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks,
						removedClientIds,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'SET_BLOCK_EDITING_MODE':
			case 'UNSET_BLOCK_EDITING_MODE':
			case 'SET_HAS_CONTROLLED_INNER_BLOCKS': {
				const updatedBlock = getBlockTreeBlock(
					nextState,
					action.clientId
				);

				// The block might have been removed in which case it'll be
				// handled by the `REMOVE_BLOCKS` action.
				if ( ! updatedBlock ) {
					break;
				}

				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						removedClientIds: [ action.clientId ],
						addedBlocks: [ updatedBlock ],
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'REPLACE_BLOCKS': {
				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks: action.blocks,
						removedClientIds: action.clientIds,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'REPLACE_INNER_BLOCKS': {
				// Get the clientIds of the blocks that are being replaced
				// from the old state, before they were removed.
				const removedClientIds = state.blocks.order.get(
					action.rootClientId
				);
				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks: action.blocks,
						removedClientIds,
					} );
				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'MOVE_BLOCKS_TO_POSITION': {
				const addedBlocks = action.clientIds.map( ( clientId ) => {
					return nextState.blocks.byClientId.get( clientId );
				} );
				const nextDerivedBlockEditingModes =
					getDerivedBlockEditingModesUpdates( {
						prevState: state,
						nextState,
						addedBlocks,
						removedClientIds: action.clientIds,
					} );

				if ( nextDerivedBlockEditingModes ) {
					return {
						...nextState,
						derivedBlockEditingModes:
							nextDerivedBlockEditingModes ??
							state.derivedBlockEditingModes,
					};
				}
				break;
			}
			case 'UPDATE_SETTINGS': {
				// Recompute the entire tree if the section root changes.
				if (
					state?.settings?.[ sectionRootClientIdKey ] !==
					nextState?.settings?.[ sectionRootClientIdKey ]
				) {
					return {
						...nextState,
						derivedBlockEditingModes:
							getDerivedBlockEditingModesForTree( nextState ),
					};
				}
				break;
			}
			case 'RESET_BLOCKS':
			case 'EDIT_CONTENT_ONLY_SECTION':
			case 'SET_EDITOR_MODE':
			case 'RESET_ZOOM_LEVEL':
			case 'SET_ZOOM_LEVEL': {
				// Recompute the entire tree if the editor mode or zoom level changes,
				// or if all the blocks are reset.
				return {
					...nextState,
					derivedBlockEditingModes:
						getDerivedBlockEditingModesForTree( nextState ),
				};
			}
		}

		// If there's no change, the derivedBlockEditingModes from the previous
		// state need to be preserved.
		nextState.derivedBlockEditingModes =
			state?.derivedBlockEditingModes ?? new Map();

		return nextState;
	};
}

function withAutomaticChangeReset( reducer ) {
	return ( state, action ) => {
		const nextState = reducer( state, action );

		if ( ! state ) {
			return nextState;
		}

		// Take over the last value without creating a new reference.
		nextState.automaticChangeStatus = state.automaticChangeStatus;

		if ( action.type === 'MARK_AUTOMATIC_CHANGE' ) {
			return {
				...nextState,
				automaticChangeStatus: 'pending',
			};
		}

		if (
			action.type === 'MARK_AUTOMATIC_CHANGE_FINAL' &&
			state.automaticChangeStatus === 'pending'
		) {
			return {
				...nextState,
				automaticChangeStatus: 'final',
			};
		}

		// If there's a change that doesn't affect blocks or selection, maintain
		// the current status.
		if (
			nextState.blocks === state.blocks &&
			nextState.selection === state.selection
		) {
			return nextState;
		}

		// As long as the state is not final, ignore any selection changes.
		if (
			nextState.automaticChangeStatus !== 'final' &&
			nextState.selection !== state.selection
		) {
			return nextState;
		}

		// Reset the status if blocks change or selection changes (when status is final).
		return {
			...nextState,
			automaticChangeStatus: undefined,
		};
	};
}

export default pipe(
	withDerivedBlockEditingModes,
	withAutomaticChangeReset
)( combinedReducers );
