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
	get,
	identity,
	difference,
	omitBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';
import { isReusableBlock } from '@wordpress/blocks';

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
 * @param {Array} blocks Blocks to flatten.
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
 * Given a block order map object, returns *all* of the block client IDs that are
 * a descendant of the given root client ID.
 *
 * Calling this with `rootClientId` set to `''` results in a list of client IDs
 * that are in the post. That is, it excludes blocks like fetched reusable
 * blocks which are stored into state but not visible.
 *
 * @param {Object}  blocksOrder  Object that maps block client IDs to a list of
 *                               nested block client IDs.
 * @param {?string} rootClientId The root client ID to search. Defaults to ''.
 *
 * @return {Array} List of descendant client IDs.
 */
function getNestedBlockClientIds( blocksOrder, rootClientId = '' ) {
	return reduce(
		blocksOrder[ rootClientId ],
		( result, clientId ) => [
			...result,
			clientId,
			...getNestedBlockClientIds( blocksOrder, clientId ),
		],
		[]
	);
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
		action.clientId === lastAction.clientId &&
		hasSameKeys( action.attributes, lastAction.attributes )
	);
}

/**
 * Utility returning an object with an empty object value for each key.
 *
 * @param {Array} objectKeys Keys to fill.
 * @return {Object} Object filled with empty object as values for each clientId.
 */
const fillKeysWithEmptyObject = ( objectKeys ) => {
	return objectKeys.reduce( ( result, key ) => {
		result[ key ] = {};
		return result;
	}, {} );
};

/**
 * Higher-order reducer intended to compute a cache key for each block in the post.
 * A new instance of the cache key (empty object) is created each time the block object
 * needs to be refreshed (for any change in the block or its children).
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withBlockCache = ( reducer ) => ( state = {}, action ) => {
	const newState = reducer( state, action );

	if ( newState === state ) {
		return state;
	}
	newState.cache = state.cache ? state.cache : {};

	/**
	 * For each clientId provided, traverses up parents, adding the provided clientIds
	 * and each parent's clientId to the returned array.
	 *
	 * When calling this function consider that it uses the old state, so any state
	 * modifications made by the `reducer` will not be present.
	 *
	 * @param {Array} clientIds an Array of block clientIds.
	 *
	 * @return {Array} The provided clientIds and all of their parent clientIds.
	 */
	const getBlocksWithParentsClientIds = ( clientIds ) => {
		return clientIds.reduce( ( result, clientId ) => {
			let current = clientId;
			do {
				result.push( current );
				current = state.parents[ current ];
			} while ( current );
			return result;
		}, [] );
	};

	switch ( action.type ) {
		case 'RESET_BLOCKS':
			newState.cache = mapValues(
				flattenBlocks( action.blocks ),
				() => ( {} )
			);
			break;
		case 'RECEIVE_BLOCKS':
		case 'INSERT_BLOCKS': {
			const updatedBlockUids = keys( flattenBlocks( action.blocks ) );
			if ( action.rootClientId ) {
				updatedBlockUids.push( action.rootClientId );
			}
			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( updatedBlockUids )
				),
			};
			break;
		}
		case 'UPDATE_BLOCK':
		case 'UPDATE_BLOCK_ATTRIBUTES':
			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( [ action.clientId ] )
				),
			};
			break;
		case 'REPLACE_BLOCKS_AUGMENTED_WITH_CHILDREN':
			const parentClientIds = fillKeysWithEmptyObject(
				getBlocksWithParentsClientIds( action.replacedClientIds )
			);

			newState.cache = {
				...omit( newState.cache, action.replacedClientIds ),
				...omit( parentClientIds, action.replacedClientIds ),
				...fillKeysWithEmptyObject(
					keys( flattenBlocks( action.blocks ) )
				),
			};
			break;
		case 'REMOVE_BLOCKS_AUGMENTED_WITH_CHILDREN':
			newState.cache = {
				...omit( newState.cache, action.removedClientIds ),
				...fillKeysWithEmptyObject(
					difference(
						getBlocksWithParentsClientIds( action.clientIds ),
						action.clientIds
					)
				),
			};
			break;
		case 'MOVE_BLOCK_TO_POSITION': {
			const updatedBlockUids = [ action.clientId ];
			if ( action.fromRootClientId ) {
				updatedBlockUids.push( action.fromRootClientId );
			}
			if ( action.toRootClientId ) {
				updatedBlockUids.push( action.toRootClientId );
			}
			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( updatedBlockUids )
				),
			};
			break;
		}
		case 'MOVE_BLOCKS_UP':
		case 'MOVE_BLOCKS_DOWN': {
			const updatedBlockUids = [];
			if ( action.rootClientId ) {
				updatedBlockUids.push( action.rootClientId );
			}
			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( updatedBlockUids )
				),
			};
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

			newState.cache = {
				...newState.cache,
				...fillKeysWithEmptyObject(
					getBlocksWithParentsClientIds( updatedBlockUids )
				),
			};
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

			const nextIsPersistentChange = get(
				state,
				[ 'isPersistentChange' ],
				true
			);
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
	const getAllChildren = ( clientIds ) => {
		let result = clientIds;
		for ( let i = 0; i < result.length; i++ ) {
			if ( ! state.order[ result[ i ] ] ) {
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
 * reusable blocks) alone.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withBlockReset = ( reducer ) => ( state, action ) => {
	if ( state && action.type === 'RESET_BLOCKS' ) {
		const visibleClientIds = getNestedBlockClientIds( state.order );
		return {
			...state,
			byClientId: {
				...omit( state.byClientId, visibleClientIds ),
				...getFlattenedBlocksWithoutAttributes( action.blocks ),
			},
			attributes: {
				...omit( state.attributes, visibleClientIds ),
				...getFlattenedBlockAttributes( action.blocks ),
			},
			order: {
				...omit( state.order, visibleClientIds ),
				...mapBlockOrder( action.blocks ),
			},
			parents: {
				...omit( state.parents, visibleClientIds ),
				...mapBlockParents( action.blocks ),
			},
			cache: {
				...omit( state.cache, visibleClientIds ),
				...mapValues( flattenBlocks( action.blocks ), () => ( {} ) ),
			},
		};
	}

	return reducer( state, action );
};

/**
 * Higher-order reducer which targets the combined blocks reducer and handles
 * the `REPLACE_INNER_BLOCKS` action. When dispatched, this action the state should become equivalent
 * to the execution of a `REMOVE_BLOCKS` action containing all the child's of the root block followed by
 * the execution of `INSERT_BLOCKS` with the new blocks.
 *
 * @param {Function} reducer Original reducer function.
 *
 * @return {Function} Enhanced reducer function.
 */
const withReplaceInnerBlocks = ( reducer ) => ( state, action ) => {
	if ( action.type !== 'REPLACE_INNER_BLOCKS' ) {
		return reducer( state, action );
	}
	let stateAfterBlocksRemoval = state;
	if ( state.order[ action.rootClientId ] ) {
		stateAfterBlocksRemoval = reducer( stateAfterBlocksRemoval, {
			type: 'REMOVE_BLOCKS',
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
	withBlockCache, // needs to be before withInnerBlocksRemoveCascade
	withInnerBlocksRemoveCascade,
	withReplaceInnerBlocks, // needs to be after withInnerBlocksRemoveCascade
	withBlockReset,
	withPersistentBlockChange,
	withIgnoredBlockChange
)( {
	byClientId( state = {}, action ) {
		switch ( action.type ) {
			case 'RESET_BLOCKS':
				return getFlattenedBlocksWithoutAttributes( action.blocks );

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
			case 'RESET_BLOCKS':
				return getFlattenedBlockAttributes( action.blocks );

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

			case 'UPDATE_BLOCK_ATTRIBUTES':
				// Ignore updates if block isn't known
				if ( ! state[ action.clientId ] ) {
					return state;
				}

				// Consider as updates only changed values
				const nextAttributes = reduce(
					action.attributes,
					( result, value, key ) => {
						if ( value !== result[ key ] ) {
							result = getMutateSafeObject(
								state[ action.clientId ],
								result
							);
							result[ key ] = value;
						}

						return result;
					},
					state[ action.clientId ]
				);

				// Skip update if nothing has been changed. The reference will
				// match the original block if `reduce` had no changed values.
				if ( nextAttributes === state[ action.clientId ] ) {
					return state;
				}

				// Otherwise replace attributes in state
				return {
					...state,
					[ action.clientId ]: nextAttributes,
				};

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
			case 'RESET_BLOCKS':
				return mapBlockOrder( action.blocks );

			case 'RECEIVE_BLOCKS':
				return {
					...state,
					...omit( mapBlockOrder( action.blocks ), '' ),
				};

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

			case 'MOVE_BLOCK_TO_POSITION': {
				const {
					fromRootClientId = '',
					toRootClientId = '',
					clientId,
				} = action;
				const { index = state[ toRootClientId ].length } = action;

				// Moving inside the same parent block
				if ( fromRootClientId === toRootClientId ) {
					const subState = state[ toRootClientId ];
					const fromIndex = subState.indexOf( clientId );
					return {
						...state,
						[ toRootClientId ]: moveTo(
							state[ toRootClientId ],
							fromIndex,
							index
						),
					};
				}

				// Moving from a parent block to another
				return {
					...state,
					[ fromRootClientId ]: without(
						state[ fromRootClientId ],
						clientId
					),
					[ toRootClientId ]: insertAt(
						state[ toRootClientId ],
						clientId,
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
			case 'RESET_BLOCKS':
				return mapBlockParents( action.blocks );

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

			case 'MOVE_BLOCK_TO_POSITION': {
				return {
					...state,
					[ action.clientId ]: action.toRootClientId || '',
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
 * Reducer returning dragging state.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {boolean} Updated state.
 */
export function isDraggingBlocks( state = false, action ) {
	switch ( action.type ) {
		case 'START_DRAGGING_BLOCKS':
			return true;

		case 'STOP_DRAGGING_BLOCKS':
			return false;
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
function selection( state = {}, action ) {
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
		case 'REPLACE_INNER_BLOCKS': // REPLACE_INNER_BLOCKS and INSERT_BLOCKS should follow the same logic.
		case 'INSERT_BLOCKS': {
			if ( ! action.updateSelection ) {
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

			const indexToSelect =
				action.indexToSelect || action.blocks.length - 1;
			const blockToSelect = action.blocks[ indexToSelect ];

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
 * Reducer returning the block selection's start.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function selectionStart( state = {}, action ) {
	switch ( action.type ) {
		case 'SELECTION_CHANGE':
			return {
				clientId: action.clientId,
				attributeKey: action.attributeKey,
				offset: action.startOffset,
			};
		case 'RESET_SELECTION':
			return action.selectionStart;
		case 'MULTI_SELECT':
			return { clientId: action.start };
	}

	return selection( state, action );
}

/**
 * Reducer returning the block selection's end.
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export function selectionEnd( state = {}, action ) {
	switch ( action.type ) {
		case 'SELECTION_CHANGE':
			return {
				clientId: action.clientId,
				attributeKey: action.attributeKey,
				offset: action.endOffset,
			};
		case 'RESET_SELECTION':
			return action.selectionEnd;
		case 'MULTI_SELECT':
			return { clientId: action.end };
	}

	return selection( state, action );
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
 * Reducer returning the intial block selection.
 *
 * Currently this in only used to restore the selection after block deletion.
 * This reducer should eventually be removed in favour of setting selection
 * directly.
 *
 * @param {boolean} state  Current state.
 * @param {Object}  action Dispatched action.
 *
 * @return {?number} Initial position: -1 or undefined.
 */
export function initialPosition( state, action ) {
	if ( action.type === 'SELECT_BLOCK' ) {
		return action.initialPosition;
	} else if ( action.type === 'REMOVE_BLOCKS' ) {
		return state;
	}

	// Reset the state by default (for any action not handled).
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
			const { rootClientId, index } = action;
			return { rootClientId, index };

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
 * @param {Object}  state                 Current state.
 * @param {Object}  action                Dispatched action.
 *
 * @return {string} Updated state.
 */
export function preferences( state = PREFERENCES_DEFAULTS, action ) {
	switch ( action.type ) {
		case 'INSERT_BLOCKS':
		case 'REPLACE_BLOCKS':
			return action.blocks.reduce( ( prevState, block ) => {
				let id = block.name;
				const insert = { name: block.name };
				if ( isReusableBlock( block ) ) {
					insert.ref = block.attributes.ref;
					id += '/' + block.attributes.ref;
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
			return { [ action.clientId ]: action.attributes };
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
		case 'STOP_TYPING':
			return state;
	}

	// Reset the state by default (for any action not handled).
}

export default combineReducers( {
	blocks,
	isTyping,
	isDraggingBlocks,
	isCaretWithinFormattedText,
	selectionStart,
	selectionEnd,
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
	automaticChangeStatus,
} );
