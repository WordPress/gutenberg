/**
 * External dependencies
 */
import {
	flow,
	reduce,
	first,
	last,
	omit,
	without,
	mapValues,
	keys,
	isEqual,
	isEmpty,
	identity,
	omitBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers, select } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { PREFERENCES_DEFAULTS, SETTINGS_DEFAULTS } from './defaults';
import { insertAt, moveTo } from './array';

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
	const result = { [ rootClientId ]: [] };

	blocks.forEach( ( block ) => {
		const { clientId, innerBlocks } = block;

		result[ rootClientId ].push( clientId );

		Object.assign( result, mapBlockOrder( innerBlocks, clientId ) );
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
	return blocks.reduce(
		( result, block ) =>
			Object.assign(
				result,
				{ [ block.clientId ]: rootClientId },
				mapBlockParents( block.innerBlocks, block.clientId )
			),
		{}
	);
}

/**
 * Helper method to iterate through all blocks, recursing into inner blocks,
 * applying a transformation function to each one.
 * Returns a flattened object with the transformed blocks.
 *
 * @param {Array}    blocks    Blocks to flatten.
 * @param {Function} transform Transforming function to be applied to each block.
 *
 * @return {Object} Flattened object.
 */
function flattenBlocks( blocks, transform = identity ) {
	const result = {};

	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		stack.push( ...innerBlocks );
		result[ block.clientId ] = transform( block );
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
 * @return {Object} Flattened block attributes object.
 */
function getFlattenedBlocksWithoutAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => omit( block, 'attributes' ) );
}

/**
 * Given an array of blocks, returns an object containing all block attributes,
 * recursing into inner blocks. Keys correspond to the block client ID, the
 * value of which is the attributes object.
 *
 * @param {Array} blocks Blocks to flatten.
 *
 * @return {Object} Flattened block attributes object.
 */
function getFlattenedBlockAttributes( blocks ) {
	return flattenBlocks( blocks, ( block ) => block.attributes );
}

/**
 * Returns an object against which it is safe to perform mutating operations,
 * given the original object and its current working copy.
 *
 * @param {Object} original Original object.
 * @param {Object} working  Working object.
 *
 * @return {Object} Mutation-safe object.
 */
function getMutateSafeObject( original, working ) {
	if ( original === working ) {
		return { ...original };
	}

	return working;
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
	return isEqual( keys( a ), keys( b ) );
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
		isEqual( action.clientIds, lastAction.clientIds ) &&
		hasSameKeys( action.attributes, lastAction.attributes )
	);
}

function buildBlockTree( state, blocks ) {
	const result = {};
	const stack = [ ...blocks ];
	const flattenedBlocks = [ ...blocks ];
	while ( stack.length ) {
		const block = stack.shift();
		stack.push( ...block.innerBlocks );
		flattenedBlocks.push( ...block.innerBlocks );
	}
	// Create objects before mutating them, that way it's always defined.
	for ( const block of flattenedBlocks ) {
		result[ block.clientId ] = {};
	}
	for ( const block of flattenedBlocks ) {
		result[ block.clientId ] = Object.assign( result[ block.clientId ], {
			...state.byClientId[ block.clientId ],
			attributes: state.attributes[ block.clientId ],
			innerBlocks: block.innerBlocks.map(
				( subBlock ) => result[ subBlock.clientId ]
			),
		} );
	}

	return result;
}

function updateParentInnerBlocksInTree(
	state,
	tree,
	updatedClientIds,
	updateChildrenOfUpdatedClientIds = false
) {
	const uncontrolledParents = new Set( [] );
	const controlledParents = new Set();
	for ( const clientId of updatedClientIds ) {
		let current = updateChildrenOfUpdatedClientIds
			? clientId
			: state.parents[ clientId ];
		do {
			if ( state.controlledInnerBlocks[ current ] ) {
				// Should stop on controlled blocks.
				// If we reach a controlled parent, break out of the loop.
				controlledParents.add( current );
				break;
			} else {
				// else continue traversing up through parents.
				uncontrolledParents.add( current );
				current = state.parents[ current ];
			}
		} while ( current !== undefined );
	}

	// To make sure the order of assignments doesn't matter,
	// we first create empty objects and mutates the inner blocks later.
	for ( const clientId of uncontrolledParents ) {
		tree[ clientId ] = {
			...tree[ clientId ],
		};
	}
	for ( const clientId of uncontrolledParents ) {
		tree[ clientId ].innerBlocks = ( state.order[ clientId ] || [] ).map(
			( subClientId ) => tree[ subClientId ]
		);
	}

	// Controlled parent blocks, need a dedicated key for their inner blocks
	// to be used when doing getBlocks( controlledBlockClientId ).
	for ( const clientId of controlledParents ) {
		tree[ 'controlled||' + clientId ] = {
			innerBlocks: ( state.order[ clientId ] || [] ).map(
				( subClientId ) => tree[ subClientId ]
			),
		};
	}

	return tree;
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
const withBlockTree = ( reducer ) => ( state = {}, action ) => {
	const newState = reducer( state, action );

	if ( newState === state ) {
		return state;
	}

	newState.tree = state.tree ? state.tree : {};
	switch ( action.type ) {
		case 'RECEIVE_BLOCKS':
		case 'INSERT_BLOCKS': {
			const subTree = buildBlockTree( newState, action.blocks );
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				{
					...newState.tree,
					...subTree,
				},
				action.rootClientId ? [ action.rootClientId ] : [ '' ],
				true
			);
			break;
		}
		case 'UPDATE_BLOCK':
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				{
					...newState.tree,
					[ action.clientId ]: {
						...newState.tree[ action.clientId ],
						...newState.byClientId[ action.clientId ],
						attributes: newState.attributes[ action.clientId ],
					},
				},
				[ action.clientId ],
				false
			);
			break;
		case 'UPDATE_BLOCK_ATTRIBUTES': {
			const newSubTree = action.clientIds.reduce(
				( result, clientId ) => {
					result[ clientId ] = {
						...newState.tree[ clientId ],
						attributes: newState.attributes[ clientId ],
					};
					return result;
				},
				{}
			);
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				{
					...newState.tree,
					...newSubTree,
				},
				action.clientIds,
				false
			);
			break;
		}
		case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
			const subTree = buildBlockTree( newState, action.blocks );
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				{
					...omit(
						newState.tree,
						action.replacedClientIds.concat(
							// Controlled inner blocks are only removed
							// if the block doesn't move to another position
							// otherwise their content will be lost.
							action.replacedClientIds
								.filter( ( clientId ) => ! subTree[ clientId ] )
								.map(
									( clientId ) => 'controlled||' + clientId
								)
						)
					),
					...subTree,
				},
				action.blocks.map( ( b ) => b.clientId ),
				false
			);

			// If there are no replaced blocks, it means we're removing blocks so we need to update their parent.
			const parentsOfRemovedBlocks = [];
			for ( const clientId of action.clientIds ) {
				if (
					state.parents[ clientId ] !== undefined &&
					( state.parents[ clientId ] === '' ||
						newState.byClientId[ state.parents[ clientId ] ] )
				) {
					parentsOfRemovedBlocks.push( state.parents[ clientId ] );
				}
			}
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				newState.tree,
				parentsOfRemovedBlocks,
				true
			);
			break;
		}
		case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
			const parentsOfRemovedBlocks = [];
			for ( const clientId of action.clientIds ) {
				if (
					state.parents[ clientId ] !== undefined &&
					( state.parents[ clientId ] === '' ||
						newState.byClientId[ state.parents[ clientId ] ] )
				) {
					parentsOfRemovedBlocks.push( state.parents[ clientId ] );
				}
			}
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				omit(
					newState.tree,
					action.removedClientIds.concat(
						action.removedClientIds.map(
							( clientId ) => 'controlled||' + clientId
						)
					)
				),
				parentsOfRemovedBlocks,
				true
			);
			break;
		case 'MOVE_BLOCKS_TO_POSITION': {
			const updatedBlockUids = [];
			if ( action.fromRootClientId ) {
				updatedBlockUids.push( action.fromRootClientId );
			}
			if ( action.toRootClientId ) {
				updatedBlockUids.push( action.toRootClientId );
			}
			if ( ! action.fromRootClientId || ! action.fromRootClientId ) {
				updatedBlockUids.push( '' );
			}
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				newState.tree,
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
			newState.tree = updateParentInnerBlocksInTree(
				newState,
				newState.tree,
				updatedBlockUids,
				true
			);
			break;
		}
		case 'SAVE_REUSABLE_BLOCK_SUCCESS': {
			const updatedBlockUids = keys(
				omitBy( newState.attributes, ( attributes, clientId ) => {
					return (
						newState.byClientId[ clientId ].name !== 'core/block' ||
						attributes.ref !== action.updatedId
					);
				} )
			);

			newState.tree = updateParentInnerBlocksInTree(
				newState,
				{
					...newState.tree,
					...updatedBlockUids.reduce( ( result, clientId ) => {
						result[ clientId ] = {
							...newState.byClientId[ clientId ],
							attributes: newState.attributes[ clientId ],
							innerBlocks: newState.tree[ clientId ].innerBlocks,
						};
						return result;
					}, {} ),
				},
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

	return ( state, action ) => {
		let nextState = reducer( state, action );

		const isExplicitPersistentChange =
			action.type === 'MARK_LAST_CHANGE_AS_PERSISTENT' ||
			markNextChangeAsNotPersistent;

		// Defer to previous state value (or default) unless changing or
		// explicitly marking as persistent.
		if ( state === nextState && ! isExplicitPersistentChange ) {
			markNextChangeAsNotPersistent =
				action.type === 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT';

			const nextIsPersistentChange = state?.isPersistentChange ?? true;
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
				! state.order[ result[ i ] ] ||
				( action.keepControlledInnerBlocks &&
					action.keepControlledInnerBlocks[ result[ i ] ] )
			) {
				continue;
			}

			if ( result === clientIds ) {
				result = [ ...result ];
			}

			result.push( ...state.order[ result[ i ] ] );
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
			byClientId: getFlattenedBlocksWithoutAttributes( action.blocks ),
			attributes: getFlattenedBlockAttributes( action.blocks ),
			order: mapBlockOrder( action.blocks ),
			parents: mapBlockParents( action.blocks ),
			controlledInnerBlocks: {},
		};

		const subTree = buildBlockTree( newState, action.blocks );
		newState.tree = {
			...subTree,
			// Root
			'': {
				innerBlocks: action.blocks.map(
					( subBlock ) => subTree[ subBlock.clientId ]
				),
			},
		};

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
	if ( state.order[ action.rootClientId ] ) {
		stateAfterBlocksRemoval = reducer( stateAfterBlocksRemoval, {
			type: 'REMOVE_BLOCKS',
			keepControlledInnerBlocks: nestedControllers,
			clientIds: state.order[ action.rootClientId ],
		} );
	}
	let stateAfterInsert = stateAfterBlocksRemoval;
	if ( action.blocks.length ) {
		stateAfterInsert = reducer( stateAfterInsert, {
			...action,
			type: 'INSERT_BLOCKS',
			index: 0,
		} );

		// We need to re-attach the block order of the controlled inner blocks.
		// Otherwise, an inner block controller's blocks will be deleted entirely
		// from its entity..
		stateAfterInsert.order = {
			...stateAfterInsert.order,
			...reduce(
				nestedControllers,
				( result, value, key ) => {
					if ( state.order[ key ] ) {
						result[ key ] = state.order[ key ];
					}
					return result;
				},
				{}
			),
		};
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

		// If a temporary reusable block is saved, we swap the temporary id with the final one
		if ( id === updatedId ) {
			return state;
		}

		state = { ...state };

		state.attributes = mapValues(
			state.attributes,
			( attributes, clientId ) => {
				const { name } = state.byClientId[ clientId ];
				if ( name === 'core/block' && attributes.ref === id ) {
					return {
						...attributes,
						ref: updatedId,
					};
				}

				return attributes;
			}
		);
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
export const blocks = flow(
	combineReducers,
	withSaveReusableBlock, // needs to be before withBlockCache
	withBlockTree, // needs to be before withInnerBlocksRemoveCascade
	withInnerBlocksRemoveCascade,
	withReplaceInnerBlocks, // needs to be after withInnerBlocksRemoveCascade
	withBlockReset,
	withPersistentBlockChange,
	withIgnoredBlockChange,
	withResetControlledBlocks
)( {
	byClientId( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS':
				return {
					...state,
					...getFlattenedBlocksWithoutAttributes( action.blocks ),
				};

			case 'UPDATE_BLOCK':
				// Ignore updates if block isn't known
				if ( ! state[ action.clientId ] ) {
					return state;
				}

				// Do nothing if only attributes change.
				const changes = omit( action.updates, 'attributes' );
				if ( isEmpty( changes ) ) {
					return state;
				}

				return {
					...state,
					[ action.clientId ]: {
						...state[ action.clientId ],
						...changes,
					},
				};

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				if ( ! action.blocks ) {
					return state;
				}

				return {
					...omit( state, action.replacedClientIds ),
					...getFlattenedBlocksWithoutAttributes( action.blocks ),
				};

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				return omit( state, action.removedClientIds );
		}

		return state;
	},

	attributes( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
			case 'INSERT_BLOCKS':
				return {
					...state,
					...getFlattenedBlockAttributes( action.blocks ),
				};

			case 'UPDATE_BLOCK':
				// Ignore updates if block isn't known or there are no attribute changes.
				if (
					! state[ action.clientId ] ||
					! action.updates.attributes
				) {
					return state;
				}

				return {
					...state,
					[ action.clientId ]: {
						...state[ action.clientId ],
						...action.updates.attributes,
					},
				};

			case 'UPDATE_BLOCK_ATTRIBUTES': {
				// Avoid a state change if none of the block IDs are known.
				if ( action.clientIds.every( ( id ) => ! state[ id ] ) ) {
					return state;
				}

				const next = action.clientIds.reduce(
					( accumulator, id ) => ( {
						...accumulator,
						[ id ]: reduce(
							action.uniqueByBlock
								? action.attributes[ id ]
								: action.attributes,
							( result, value, key ) => {
								// Consider as updates only changed values.
								if ( value !== result[ key ] ) {
									result = getMutateSafeObject(
										state[ id ],
										result
									);
									result[ key ] = value;
								}

								return result;
							},
							state[ id ]
						),
					} ),
					{}
				);

				if (
					action.clientIds.every(
						( id ) => next[ id ] === state[ id ]
					)
				) {
					return state;
				}

				return { ...state, ...next };
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				if ( ! action.blocks ) {
					return state;
				}

				return {
					...omit( state, action.replacedClientIds ),
					...getFlattenedBlockAttributes( action.blocks ),
				};

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				return omit( state, action.removedClientIds );
		}

		return state;
	},

	order( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS': {
				const blockOrder = mapBlockOrder( action.blocks );
				return {
					...state,
					...omit( blockOrder, '' ),
					'': ( state?.[ '' ] || [] ).concat( blockOrder[ '' ] ),
				};
			}
			case 'INSERT_BLOCKS': {
				const { rootClientId = '' } = action;
				const subState = state[ rootClientId ] || [];
				const mappedBlocks = mapBlockOrder(
					action.blocks,
					rootClientId
				);
				const { index = subState.length } = action;

				return {
					...state,
					...mappedBlocks,
					[ rootClientId ]: insertAt(
						subState,
						mappedBlocks[ rootClientId ],
						index
					),
				};
			}

			case 'MOVE_BLOCKS_TO_POSITION': {
				const {
					fromRootClientId = '',
					toRootClientId = '',
					clientIds,
				} = action;
				const { index = state[ toRootClientId ].length } = action;

				// Moving inside the same parent block
				if ( fromRootClientId === toRootClientId ) {
					const subState = state[ toRootClientId ];
					const fromIndex = subState.indexOf( clientIds[ 0 ] );
					return {
						...state,
						[ toRootClientId ]: moveTo(
							state[ toRootClientId ],
							fromIndex,
							index,
							clientIds.length
						),
					};
				}

				// Moving from a parent block to another
				return {
					...state,
					[ fromRootClientId ]: without(
						state[ fromRootClientId ],
						...clientIds
					),
					[ toRootClientId ]: insertAt(
						state[ toRootClientId ],
						clientIds,
						index
					),
				};
			}

			case 'MOVE_BLOCKS_UP': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = first( clientIds );
				const subState = state[ rootClientId ];

				if (
					! subState.length ||
					firstClientId === first( subState )
				) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );

				return {
					...state,
					[ rootClientId ]: moveTo(
						subState,
						firstIndex,
						firstIndex - 1,
						clientIds.length
					),
				};
			}

			case 'MOVE_BLOCKS_DOWN': {
				const { clientIds, rootClientId = '' } = action;
				const firstClientId = first( clientIds );
				const lastClientId = last( clientIds );
				const subState = state[ rootClientId ];

				if ( ! subState.length || lastClientId === last( subState ) ) {
					return state;
				}

				const firstIndex = subState.indexOf( firstClientId );

				return {
					...state,
					[ rootClientId ]: moveTo(
						subState,
						firstIndex,
						firstIndex + 1,
						clientIds.length
					),
				};
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN': {
				const { clientIds } = action;
				if ( ! action.blocks ) {
					return state;
				}

				const mappedBlocks = mapBlockOrder( action.blocks );

				return flow( [
					( nextState ) =>
						omit( nextState, action.replacedClientIds ),
					( nextState ) => ( {
						...nextState,
						...omit( mappedBlocks, '' ),
					} ),
					( nextState ) =>
						mapValues( nextState, ( subState ) =>
							reduce(
								subState,
								( result, clientId ) => {
									if ( clientId === clientIds[ 0 ] ) {
										return [
											...result,
											...mappedBlocks[ '' ],
										];
									}

									if (
										clientIds.indexOf( clientId ) === -1
									) {
										result.push( clientId );
									}

									return result;
								},
								[]
							)
						),
				] )( state );
			}

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				return flow( [
					// Remove inner block ordering for removed blocks
					( nextState ) => omit( nextState, action.removedClientIds ),

					// Remove deleted blocks from other blocks' orderings
					( nextState ) =>
						mapValues( nextState, ( subState ) =>
							without( subState, ...action.removedClientIds )
						),
				] )( state );
		}

		return state;
	},

	// While technically redundant data as the inverse of `order`, it serves as
	// an optimization for the selectors which derive the ancestry of a block.
	parents( state = {}, action ) {
		switch ( action.type ) {
			case 'RECEIVE_BLOCKS':
				return {
					...state,
					...mapBlockParents( action.blocks ),
				};

			case 'INSERT_BLOCKS':
				return {
					...state,
					...mapBlockParents(
						action.blocks,
						action.rootClientId || ''
					),
				};

			case 'MOVE_BLOCKS_TO_POSITION': {
				return {
					...state,
					...action.clientIds.reduce( ( accumulator, id ) => {
						accumulator[ id ] = action.toRootClientId || '';
						return accumulator;
					}, {} ),
				};
			}

			case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				return {
					...omit( state, action.replacedClientIds ),
					...mapBlockParents(
						action.blocks,
						state[ action.clientIds[ 0 ] ]
					),
				};

			case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
				return omit( state, action.removedClientIds );
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
 * Reducer returning whether the caret is within formatted text.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isCaretWithinFormattedText( state = false, action ) {
	switch ( action.type ) {
		case 'ENTER_FORMATTED_TEXT':
			return true;

		case 'EXIT_FORMATTED_TEXT':
			return false;
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
		case 'RESET_SELECTION':
			const { selectionStart, selectionEnd } = action;
			return {
				selectionStart,
				selectionEnd,
			};
		case 'MULTI_SELECT':
			const { start, end } = action;
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

	return {
		selectionStart: selectionHelper( state.selectionStart, action ),
		selectionEnd: selectionHelper( state.selectionEnd, action ),
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
export function insertionPoint( state = null, action ) {
	switch ( action.type ) {
		case 'SHOW_INSERTION_POINT':
			const { rootClientId, index, __unstableWithInserter } = action;
			return { rootClientId, index, __unstableWithInserter };

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
		case 'UPDATE_SETTINGS':
			return {
				...state,
				...action.settings,
			};
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
		case 'REPLACE_BLOCKS':
			return action.blocks.reduce( ( prevState, block ) => {
				const { attributes, name: blockName } = block;
				const match = select( blocksStore ).getActiveBlockVariation(
					blockName,
					attributes
				);
				// If a block variation match is found change the name to be the same with the
				// one that is used for block variations in the Inserter (`getItemFromVariation`).
				let id = match?.name
					? `${ blockName }/${ match.name }`
					: blockName;
				const insert = { name: id };
				if ( blockName === 'core/block' ) {
					insert.ref = attributes.ref;
					id += '/' + attributes.ref;
				}

				return {
					...prevState,
					insertUsage: {
						...prevState.insertUsage,
						[ id ]: {
							time: action.time,
							count: prevState.insertUsage[ id ]
								? prevState.insertUsage[ id ].count + 1
								: 1,
							insert,
						},
					},
				};
			}, state );
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
			return omit( state, action.clientIds );
		}
		case 'UPDATE_BLOCK_LIST_SETTINGS': {
			const { clientId } = action;
			if ( ! action.settings ) {
				if ( state.hasOwnProperty( clientId ) ) {
					return omit( state, clientId );
				}

				return state;
			}

			if ( isEqual( state[ clientId ], action.settings ) ) {
				return state;
			}

			return {
				...state,
				[ clientId ]: action.settings,
			};
		}
	}
	return state;
};

/**
 * Reducer returning whether the navigation mode is enabled or not.
 *
 * @param {string} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function isNavigationMode( state = false, action ) {
	// Let inserting block always trigger Edit mode.
	if ( action.type === 'INSERT_BLOCKS' ) {
		return false;
	}

	if ( action.type === 'SET_NAVIGATION_MODE' ) {
		return action.isNavigationMode;
	}

	return state;
}

/**
 * Reducer returning whether the block moving mode is enabled or not.
 *
 * @param {string|null} state  Current state.
 * @param {Object}      action Dispatched action.
 *
 * @return {string|null} Updated state.
 */
export function hasBlockMovingClientId( state = null, action ) {
	// Let inserting block always trigger Edit mode.

	if ( action.type === 'SET_BLOCK_MOVING_MODE' ) {
		return action.hasBlockMovingClientId;
	}

	if ( action.type === 'SET_NAVIGATION_MODE' ) {
		return null;
	}

	return state;
}

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
export function lastBlockAttributesChange( state, action ) {
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
					[ id ]: action.uniqueByBlock
						? action.attributes[ id ]
						: action.attributes,
				} ),
				{}
			);
	}

	return null;
}

/**
 * Reducer returning automatic change state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {string} Updated state.
 */
export function automaticChangeStatus( state, action ) {
	switch ( action.type ) {
		case 'MARK_AUTOMATIC_CHANGE':
			return 'pending';
		case 'MARK_AUTOMATIC_CHANGE_FINAL':
			if ( state === 'pending' ) {
				return 'final';
			}

			return;
		case 'SELECTION_CHANGE':
			// As long as the state is not final, ignore any selection changes.
			if ( state !== 'final' ) {
				return state;
			}

			return;
		// Undoing an automatic change should still be possible after mouse
		// move.
		case 'START_TYPING':
		case 'STOP_TYPING':
			return state;
	}

	// Reset the state by default (for any action not handled).
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
			if ( ! action.blocks.length ) {
				return state;
			}

			const clientId = action.blocks[ 0 ].clientId;
			const source = action.meta?.source;

			return { clientId, source };
		case 'RESET_BLOCKS':
			return {};
	}
	return state;
}

export default combineReducers( {
	blocks,
	isTyping,
	draggedBlocks,
	isCaretWithinFormattedText,
	selection,
	isMultiSelecting,
	isSelectionEnabled,
	initialPosition,
	blocksMode,
	blockListSettings,
	insertionPoint,
	template,
	settings,
	preferences,
	lastBlockAttributesChange,
	isNavigationMode,
	hasBlockMovingClientId,
	automaticChangeStatus,
	highlightedBlock,
	lastBlockInserted,
} );
