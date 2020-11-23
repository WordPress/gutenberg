/**
 * External dependencies
 */
import {
	castArray,
	first,
	last,
	some,
	omit,
	identity,
	pickBy,
	reduce,
	isEmpty,
	without,
	flow,
	mapValues,
	isEqual,
	findKey,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	cloneBlock,
	createBlock,
	getBlockType,
	getDefaultBlockName,
	hasBlockSupport,
	isReusableBlock,
	switchToBlockType,
	doBlocksMatchTemplate,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { create, toHTMLString, insert, remove } from '@wordpress/rich-text';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	blockAttributesByClientId,
	blockMetadataByClientId,
	blockOrderByClientId,
	controlledInnerBlocks,
	highlightedBlock,
	initialPosition,
	selectionStart,
	insertionPoint,
	insertionPointVisibility,
	selectionEnd,
	isSelectionEnabled,
	isMultiSelecting,
	preferences,
	isNavigationMode,
	templateValidity,
	blocksModeByClientId,
	draggedBlocks,
	isTyping,
	isCaretWithinFormattedText,
	blockListSettingsByClientId,
	settings,
	hasBlockMovingClientId,
} from './atoms';
import {
	getPreviousBlockClientId,
	getNextBlockClientId,
	getSettings,
	getBlockCount,
	getTemplateLock,
	getBlockRootClientId,
	canInsertBlockType,
	getBlocksByClientId,
	getBlockIndex,
	getBlock,
	getSelectionStart,
	getTemplate,
	getBlocks,
	getSelectedBlockCount,
} from './selectors';
import { insertAt, moveTo } from './array';

function getBlocksWithDefaultStylesApplied( blocks, blockEditorSettings ) {
	const preferredStyleVariations =
		blockEditorSettings?.__experimentalPreferredStyleVariations?.value ??
		{};
	return blocks.map( ( block ) => {
		const blockName = block.name;
		if ( ! hasBlockSupport( blockName, 'defaultStylePicker', true ) ) {
			return block;
		}
		if ( ! preferredStyleVariations[ blockName ] ) {
			return block;
		}
		const className = block.attributes?.className;
		if ( className?.includes( 'is-style-' ) ) {
			return block;
		}
		const { attributes = {} } = block;
		const blockStyle = preferredStyleVariations[ blockName ];
		return {
			...block,
			attributes: {
				...attributes,
				className: `${
					className || ''
				} is-style-${ blockStyle }`.trim(),
			},
		};
	} );
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
 * Given a block order map object, returns *all* of the block client IDs that are
 * a descendant of the given root client ID.
 *
 * Calling this with `rootClientId` set to `''` results in a list of client IDs
 * that are in the post. That is, it excludes blocks like fetched reusable
 * blocks which are stored into state but not visible. It also excludes
 * InnerBlocks controllers, like template parts.
 *
 * It is important to exclude the full inner block controller and not just the
 * inner blocks because in many cases, we need to persist the previous value of
 * an inner block controller. To do so, it must be excluded from the list of
 * client IDs which are considered to be part of the top-level entity.
 *
 * @param {Object}  blocksOrder  Object that maps block client IDs to a list of
 *                               nested block client IDs.
 * @param {?string} rootClientId The root client ID to search. Defaults to ''.
 * @param {?Object} _controlledInnerBlocks The InnerBlocks controller state.
 *
 * @return {Array} List of descendant client IDs.
 */
function getNestedBlockClientIds(
	blocksOrder,
	rootClientId = '',
	_controlledInnerBlocks = {}
) {
	return reduce(
		blocksOrder[ rootClientId ],
		( result, clientId ) => {
			if ( !! _controlledInnerBlocks[ clientId ] ) {
				return result;
			}
			return [
				...result,
				clientId,
				...getNestedBlockClientIds( blocksOrder, clientId ),
			];
		},
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

// Gets all children which need to be removed.
function getAllBlocksChildren(
	currentBlockOrder,
	clientIds,
	keepControlledInnerBlocks
) {
	let result = clientIds;
	for ( let i = 0; i < result.length; i++ ) {
		if (
			! currentBlockOrder[ result[ i ] ] ||
			( keepControlledInnerBlocks &&
				keepControlledInnerBlocks[ result[ i ] ] )
		) {
			continue;
		}

		if ( result === clientIds ) {
			result = [ ...result ];
		}

		result.push( ...currentBlockOrder[ result[ i ] ] );
	}
	return result;
}

/**
 * Generator which will yield a default block insert action if there
 * are no other blocks at the root of the editor. This generator should be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 */
const ensureDefaultBlock = () => ( { get, set } ) => {
	const count = get( getBlockCount() );

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	if ( count === 0 ) {
		return insertDefaultBlock()( { get, set } );
	}
};

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side-
 * effect of the block reset action.
 *
 * @param blocks
 * @return {?Object} New validity set action if validity has changed.
 */
export const validateBlocksToTemplate = ( blocks ) => ( { get, set } ) => {
	const template = get( getTemplate() );
	const templateLock = get( getTemplateLock() );

	// Unlocked templates are considered always valid because they act
	// as default values only.
	const isBlocksValidToTemplate =
		! template ||
		templateLock !== 'all' ||
		doBlocksMatchTemplate( blocks, template );
	setTemplateValidity( isBlocksValidToTemplate )( { get, set } );
};

const updatePreferences = ( blocks ) => ( { get, set } ) => {
	const time = Date.now();
	set(
		preferences,
		blocks.reduce( ( prevState, block ) => {
			let id = block.name;
			const newInsert = { name: block.name };
			if ( isReusableBlock( block ) ) {
				newInsert.ref = block.attributes.ref;
				id += '/' + block.attributes.ref;
			}

			return {
				...prevState,
				insertUsage: {
					...prevState.insertUsage,
					[ id ]: {
						time,
						count: prevState.insertUsage[ id ]
							? prevState.insertUsage[ id ].count + 1
							: 1,
						insert: newInsert,
					},
				},
			};
		}, get( preferences ) )
	);
};

/**
 * Returns an action object used in signalling that blocks state should be
 * reset to the specified array of blocks, taking precedence over any other
 * content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 */
export const resetBlocks = ( blocks ) => ( { get, set } ) => {
	const currentOrder = get( blockOrderByClientId );
	const currentControllerBlocks = get( controlledInnerBlocks );
	/**
	 * A list of client IDs associated with the top level entity (like a
	 * post or template). It excludes the client IDs of blocks associated
	 * with other entities, like inner block controllers or reusable blocks.
	 */
	const visibleClientIds = getNestedBlockClientIds(
		currentOrder,
		'',
		currentControllerBlocks
	);

	// pickBy returns only the truthy values from controlledInnerBlocks
	const controlledInnerBlockIds = Object.keys(
		pickBy( currentControllerBlocks )
	);

	set( blockMetadataByClientId, {
		...omit( get( blockMetadataByClientId ), visibleClientIds ),
		...getFlattenedBlocksWithoutAttributes( blocks ),
	} );
	set( blockAttributesByClientId, {
		...omit( get( blockAttributesByClientId ), visibleClientIds ),
		...getFlattenedBlockAttributes( blocks ),
	} );
	set( blockOrderByClientId, {
		...omit( currentOrder, visibleClientIds ),
		...omit( mapBlockOrder( blocks ), controlledInnerBlockIds ),
	} );

	validateBlocksToTemplate( blocks );
};

/**
 * Returns an action object used in signalling that blocks have been received.
 * Unlike resetBlocks, these should be appended to the existing known set, not
 * replacing.
 *
 * @param {Object[]} blocks Array of block objects.
 */
export const receiveBlocks = ( blocks ) => ( { get, set } ) => {
	set( blockMetadataByClientId, {
		...get( blockMetadataByClientId ),
		...getFlattenedBlocksWithoutAttributes( blocks ),
	} );

	set( blockAttributesByClientId, {
		...get( blockAttributesByClientId ),
		...getFlattenedBlockAttributes( blocks ),
	} );

	set( blockOrderByClientId, {
		...get( blockOrderByClientId ),
		...omit( mapBlockOrder( blocks ), '' ),
	} );
};

/**
 * Returns an action object used in signalling that an array of blocks should
 * be inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object[]}   blocks          Block objects to insert.
 * @param {?number}    index           Index at which block should be inserted.
 * @param {?string}    rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean}   updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 * @param {?Object}    meta            Optional Meta values to be passed to the action object.
 */
export const insertBlocks = (
	blocks,
	index,
	rootClientId,
	updateSelection = true
) => ( { get, set } ) => {
	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		get( getSettings() )
	);
	const allowedBlocks = [];
	for ( const block of blocks ) {
		const isValid = get( canInsertBlockType( block.name, rootClientId ) );
		if ( isValid ) {
			allowedBlocks.push( block );
		}
	}
	if ( allowedBlocks.length ) {
		set( blockMetadataByClientId, {
			...get( blockMetadataByClientId ),
			...getFlattenedBlocksWithoutAttributes( blocks ),
		} );

		set( blockAttributesByClientId, {
			...get( blockAttributesByClientId ),
			...getFlattenedBlockAttributes( blocks ),
		} );

		const currentBlockOrder = get( blockOrderByClientId );
		const mappedBlocks = mapBlockOrder( allowedBlocks, rootClientId );
		const subOrderState = currentBlockOrder[ rootClientId ] || [];
		set( blockOrderByClientId, {
			...currentBlockOrder,
			...mappedBlocks,
			[ rootClientId ]: insertAt(
				subOrderState,
				mappedBlocks[ rootClientId ],
				index ?? subOrderState.length
			),
		} );

		if ( updateSelection && allowedBlocks.length ) {
			set( selectionStart, { clientId: allowedBlocks[ 0 ].clientId } );
			set( selectionEnd, { clientId: allowedBlocks[ 0 ].clientId } );
		}

		set( insertionPoint, null );
		set( insertionPointVisibility, false );
		set( isNavigationMode, false );
		updatePreferences( allowedBlocks )( { get, set } );
	}

	return allowedBlocks;
};

/**
 * Returns an action object used in signalling that a single block should be
 * inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object}  block            Block object to insert.
 * @param {?number} index            Index at which block should be inserted.
 * @param {?string} rootClientId     Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 */
export const insertBlock = insertBlocks;

/**
 * Yields action objects used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block should be
 *                                         selected when a block is removed.
 */
export const removeBlocks = ( clientIds, selectPrevious = true ) => ( {
	get,
	set,
} ) => {
	if ( ! clientIds ) {
		return;
	}
	clientIds = castArray( clientIds );

	if ( ! clientIds.length ) {
		return;
	}
	const rootClientId = get( getBlockRootClientId( clientIds[ 0 ] ) );
	const isLocked = get( getTemplateLock( rootClientId ) );
	if ( isLocked ) {
		return;
	}

	let previousBlockId;
	if ( selectPrevious ) {
		previousBlockId = selectPreviousBlock( clientIds[ 0 ] )( { get, set } );
	} else {
		previousBlockId = get( getPreviousBlockClientId( clientIds[ 0 ] ) );
	}

	const currentBlockOrder = get( blockOrderByClientId );
	const allRemovedClientIds = getAllBlocksChildren(
		currentBlockOrder,
		clientIds
	);
	set(
		blockMetadataByClientId,
		omit( get( blockMetadataByClientId ), allRemovedClientIds )
	);
	set(
		blockAttributesByClientId,
		omit( get( blockAttributesByClientId ), allRemovedClientIds )
	);
	set(
		blockOrderByClientId,
		flow( [
			// Remove inner block ordering for removed blocks
			( nextState ) => omit( nextState, allRemovedClientIds ),

			// Remove deleted blocks from other blocks' orderings
			( nextState ) =>
				mapValues( nextState, ( subState ) =>
					without( subState, ...allRemovedClientIds )
				),
		] )( currentBlockOrder )
	);
	if ( allRemovedClientIds.includes( get( selectionStart ).clientId ) ) {
		set( selectionStart, {} );
	}
	if ( allRemovedClientIds.includes( get( selectionEnd ).clientId ) ) {
		set( selectionEnd, {} );
	}
	set( insertionPoint, null );
	set( insertionPointVisibility, false );
	set(
		blockListSettingsByClientId,
		omit( get( blockAttributesByClientId ), allRemovedClientIds )
	);

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	const defaultBlockId = ensureDefaultBlock()( { get, set } );

	return [ previousBlockId || defaultBlockId ];
};

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID is to be removed.
 *
 * @param {string}  clientId       Client ID of block to remove.
 * @param {boolean} selectPrevious True if the previous block should be
 *                                 selected when a block is removed.
 */
export const removeBlock = removeBlocks;

/**
 * Returns an action object used in signalling that the multiple blocks'
 * attributes with the specified client IDs have been updated.
 *
 * @param {string|string[]} clientIds  Block client IDs.
 * @param {Object}          attributes Block attributes to be merged.
 */
export const updateBlockAttributes = ( clientIds, attributes ) => ( {
	get,
	set,
} ) => {
	clientIds = castArray( clientIds );
	const currentBlockAttributes = get( blockAttributesByClientId );
	// Avoid a state change if none of the block IDs are known.
	if ( clientIds.every( ( id ) => ! currentBlockAttributes[ id ] ) ) {
		return;
	}

	const next = clientIds.reduce(
		( accumulator, id ) => ( {
			...accumulator,
			[ id ]: reduce(
				attributes,
				( result, value, key ) => {
					// Consider as updates only changed values.
					if ( value !== result[ key ] ) {
						result = getMutateSafeObject(
							currentBlockAttributes[ id ],
							result
						);
						result[ key ] = value;
					}

					return result;
				},
				currentBlockAttributes[ id ]
			),
		} ),
		{}
	);

	if (
		clientIds.every( ( id ) => next[ id ] === currentBlockAttributes[ id ] )
	) {
		return;
	}

	set( blockAttributesByClientId, {
		...currentBlockAttributes,
		...next,
	} );
};

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been updated.
 *
 * @param {string} clientId Block client ID.
 * @param {Object} updates  Block attributes to be merged.
 */
export const updateBlock = ( clientId, updates ) => ( { get, set } ) => {
	const currentBlockMetadata = get( blockMetadataByClientId );

	// Ignore updates if block isn't known
	if ( ! currentBlockMetadata[ clientId ] ) {
		return;
	}

	const changesWithoutAttributes = omit( updates, 'attributes' );
	if ( ! isEmpty( changesWithoutAttributes ) ) {
		set( blockMetadataByClientId, {
			...currentBlockMetadata,
			[ clientId ]: {
				...currentBlockMetadata[ clientId ],
				...changesWithoutAttributes,
			},
		} );
	}

	if ( updates.attributes ) {
		const currentBlockAttributes = get( blockAttributesByClientId );
		set( blockAttributesByClientId, {
			...currentBlockAttributes,
			[ clientId ]: {
				...currentBlockAttributes[ clientId ],
				...updates.attributes,
			},
		} );
	}
};

/**
 * A block selection object.
 *
 * @typedef {Object} WPBlockSelection
 *
 * @property {string} clientId     A block client ID.
 * @property {string} attributeKey A block attribute key.
 * @property {number} offset       An attribute value offset, based on the rich
 *                                 text value. See `wp.richText.create`.
 */

/**
 * Returns an action object used in signalling that selection state should be
 * reset to the specified selection.
 *
 * @param {WPBlockSelection} start The selection start.
 * @param {WPBlockSelection} end   The selection end.
 */
export const resetSelection = ( start, end ) => ( { set } ) => {
	set( selectionStart, start );
	set( selectionEnd, end );
};

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been selected, optionally accepting a position
 * value reflecting its selection directionality. An initialPosition of -1
 * reflects a reverse selection.
 *
 * @param {string}  clientId         Block client ID.
 * @param {?number} _initialPosition Optional initial position. Pass as -1 to
 *                                  reflect reverse selection.
 */
export const selectBlock = ( clientId, _initialPosition = null ) => ( {
	get,
	set,
} ) => {
	if ( get( highlightedBlock ) === clientId ) {
		set( highlightedBlock, null );
	}

	if ( get( selectionStart ).clientId !== clientId ) {
		set( selectionStart, { clientId } );
	}

	if ( get( selectionEnd ).clientId !== clientId ) {
		set( selectionEnd, { clientId } );
	}

	set( insertionPoint, null );
	set( insertionPointVisibility, false );
	set( initialPosition, _initialPosition );
};

/**
 * Yields action objects used in signalling that the block preceding the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export const selectPreviousBlock = ( clientId ) => ( { get, set } ) => {
	const previousBlockClientId = get( getPreviousBlockClientId( clientId ) );
	if ( previousBlockClientId ) {
		selectBlock( previousBlockClientId, -1 )( { get, set } );
		return [ previousBlockClientId ];
	}
};

/**
 * Yields action objects used in signalling that the block following the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export const selectNextBlock = ( clientId ) => ( { get, set } ) => {
	const nextBlockClientId = get( getNextBlockClientId( clientId ) );
	if ( nextBlockClientId ) {
		selectBlock( nextBlockClientId, -1 )( { get, set } );
		return [ nextBlockClientId ];
	}
};

/**
 * Returns an action object used in signalling that a block multi-selection has started.
 */
export const startMultiSelect = () => ( { set } ) => {
	set( isMultiSelecting, true );
};

/**
 * Returns an action object used in signalling that block multi-selection stopped.
 */
export const stopMultiSelect = () => ( { set } ) => {
	set( isMultiSelecting, false );
};

/**
 * Returns an action object used in signalling that block multi-selection changed.
 *
 * @param {string} start First block of the multi selection.
 * @param {string} end   Last block of the multiselection.
 *
 * @return {Object} Action object.
 */
export const multiSelect = ( start, end ) => ( { get, set } ) => {
	set( selectionStart, { clientId: start } );
	set( selectionEnd, { clientId: end } );
	const blockCount = get( getSelectedBlockCount() );
	speak(
		sprintf(
			/* translators: %s: number of selected blocks */
			_n( '%s block selected.', '%s blocks selected.', blockCount ),
			blockCount
		),
		'assertive'
	);
};

/**
 * Returns an action object used in signalling that the block selection is cleared.
 *
 * @return {Object} Action object.
 */
export const clearSelectedBlock = () => ( { get, set } ) => {
	if ( get( selectionStart ).clientId ) {
		set( selectionStart, {} );
	}
	if ( get( selectionEnd ).clientId ) {
		set( selectionEnd, {} );
	}
	set( insertionPoint, null );
	set( insertionPointVisibility, false );
};

/**
 * Returns an action object that enables or disables block selection.
 *
 * @param {boolean} [isEnabled=true] Whether block selection should
 *                                            be enabled.
 */
export const toggleSelection = ( isEnabled = true ) => ( { set } ) => {
	set( isSelectionEnabled, isEnabled );
};

/**
 * Returns an action object signalling that a blocks should be replaced with
 * one or more replacement blocks.
 *
 * @param {(string|string[])} clientIds Block client ID(s) to replace.
 * @param {(Object|Object[])} blocks    Replacement block(s).
 * @param {number} indexToSelect        Index of replacement block to select.
 * @param {number} _initialPosition     Index of caret after in the selected block after the operation.
 */
export const replaceBlocks = (
	clientIds,
	blocks,
	indexToSelect,
	_initialPosition
) => ( { get, set } ) => {
	clientIds = castArray( clientIds );
	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		get( getSettings() )
	);
	const rootClientId = get( getBlockRootClientId( first( clientIds ) ) );

	// Replace is valid if the new blocks can be inserted in the root block.
	for ( let index = 0; index < blocks.length; index++ ) {
		const block = blocks[ index ];
		const canInsertBlock = get(
			canInsertBlockType( block.name, rootClientId )
		);
		if ( ! canInsertBlock ) {
			return;
		}
	}

	const replacedClientIds = getAllBlocksChildren(
		get( blockOrderByClientId ),
		clientIds
	);
	if ( blocks.length ) {
		set( blockMetadataByClientId, {
			...omit( get( blockMetadataByClientId ), replacedClientIds ),
			...getFlattenedBlocksWithoutAttributes( blocks ),
		} );

		set( blockAttributesByClientId, {
			...omit( get( blockAttributesByClientId ), replacedClientIds ),
			...getFlattenedBlockAttributes( blocks ),
		} );

		const mappedBlocks = mapBlockOrder( blocks );

		set(
			blockOrderByClientId,
			flow( [
				( nextState ) => omit( nextState, replacedClientIds ),
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
									return [ ...result, ...mappedBlocks[ '' ] ];
								}

								if ( clientIds.indexOf( clientId ) === -1 ) {
									result.push( clientId );
								}

								return result;
							},
							[]
						)
					),
			] )( get( blockOrderByClientId ) )
		);

		const updateSelection = ( currentSelection ) => {
			if ( ! replacedClientIds.includes( currentSelection.clientId ) ) {
				return currentSelection;
			}

			const blockToSelect = blocks[ indexToSelect || blocks.length - 1 ];
			if ( ! blockToSelect ) {
				return {};
			}
			if ( blockToSelect.clientId === currentSelection.clientId ) {
				return currentSelection;
			}
			const newState = { clientId: blockToSelect.clientId };
			if ( typeof _initialPosition === 'number' ) {
				newState.initialPosition = _initialPosition;
			}
			return newState;
		};
		set( selectionStart, updateSelection( get( selectionStart ) ) );
		set( selectionEnd, updateSelection( get( selectionEnd ) ) );
		if ( typeof _initialPosition === 'number' ) {
			set( initialPosition, _initialPosition );
		}
		set( insertionPoint, null );
		set( insertionPointVisibility, false );
		set(
			blockListSettingsByClientId,
			omit( get( blockAttributesByClientId ), replacedClientIds )
		);
		updatePreferences( blocks )( { get, set } );
	}

	ensureDefaultBlock()( { get, set } );
};

/**
 * Returns an action object signalling that a single block should be replaced
 * with one or more replacement blocks.
 *
 * @param {(string|string[])} clientId Block client ID to replace.
 * @param {(Object|Object[])} block    Replacement block(s).
 */
export const replaceBlock = replaceBlocks;

/**
 * Higher-order action creator which, given the action type to dispatch creates
 * an action creator for managing block movement.
 *
 * @param {number} offset Offset.
 * @return {Function} Action creator.
 */
function createOnMove( offset ) {
	return ( clientIds, rootClientId ) => ( { get, set } ) => {
		const firstClientId = first( clientIds );
		const currentOrder = get( blockOrderByClientId );
		const subState = currentOrder[ rootClientId ];
		const firstIndex = subState.indexOf( firstClientId );

		if (
			! firstIndex + offset < 0 ||
			firstIndex + offset + clientIds.length >= subState.length
		) {
			return;
		}

		set( blockOrderByClientId, {
			...currentOrder,
			[ rootClientId ]: moveTo(
				subState,
				firstIndex,
				firstIndex + offset,
				clientIds.length
			),
		} );
	};
}

export const moveBlocksDown = createOnMove( -1 );
export const moveBlocksUp = createOnMove( +1 );

/**
 * Returns an action object signalling that the given blocks should be moved to
 * a new position.
 *
 * @param  {?string} clientIds        The client IDs of the blocks.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the blocks to.
 */
export const moveBlocksToPosition = (
	clientIds,
	fromRootClientId = '',
	toRootClientId = '',
	index
) => ( { get, set } ) => {
	clientIds = castArray( clientIds );
	const templateLock = get( getTemplateLock( fromRootClientId ) );

	// If locking is equal to all on the original clientId (fromRootClientId),
	// it is not possible to move the block to any other position.
	if ( templateLock === 'all' ) {
		return;
	}

	// If templateLock is insert we can not remove the block from the parent.
	// Given that here we know that we are moving the block to a different
	// parent, the move should not be possible if the condition is true.
	if ( templateLock === 'insert' ) {
		return;
	}

	const canInsertBlocks = get( canInsertBlocks( clientIds, toRootClientId ) );

	// If moving to other parent block, the move is possible if we can insert a block of the same type inside the new parent block.
	if ( ! canInsertBlocks ) {
		return;
	}

	// const { index = state[ toRootClientId ].length } = action;
	const currentBlockOrder = get( blockAttributesByClientId );
	// Moving inside the same parent block
	if ( fromRootClientId === toRootClientId ) {
		const subState = currentBlockOrder[ toRootClientId ];
		const fromIndex = subState.indexOf( clientIds[ 0 ] );
		set( blockOrderByClientId, {
			...currentBlockOrder,
			[ toRootClientId ]: moveTo(
				subState,
				fromIndex,
				index ?? currentBlockOrder.length,
				clientIds.length
			),
		} );
	} else {
		set( blockOrderByClientId, {
			...currentBlockOrder,
			[ fromRootClientId ]: without(
				currentBlockOrder[ fromRootClientId ],
				...clientIds
			),
			[ toRootClientId ]: insertAt(
				currentBlockOrder[ toRootClientId ],
				clientIds,
				index ?? currentBlockOrder.length
			),
		} );
	}
};

/**
 * Returns an action object signalling that the given block should be moved to a
 * new position.
 *
 * @param  {?string} clientId         The client ID of the block.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the block to.
 */
export const moveBlockToPosition = moveBlocksToPosition;

/**
 * Sets the insertion point without showing it to users.
 *
 * Components like <Inserter> will default to inserting blocks at this point.
 *
 * @param {?string} rootClientId Root client ID of block list in which to
 *                               insert. Use `undefined` for the root block
 *                               list.
 * @param {number} index         Index at which block should be inserted.
 */
export const __unstableSetInsertionPoint = ( rootClientId, index ) => ( {
	set,
} ) => {
	set( insertionPoint, {
		rootClientId,
		index,
	} );
};

/**
 * Sets the insertion point and shows it to users.
 *
 * Components like <Inserter> will default to inserting blocks at this point.
 *
 * @param {?string} rootClientId Root client ID of block list in which to
 *                               insert. Use `undefined` for the root block
 *                               list.
 * @param {number} index         Index at which block should be inserted.
 */
export const showInsertionPoint = ( rootClientId, index ) => ( { set } ) => {
	__unstableSetInsertionPoint( rootClientId, index )( { set } );
	set( insertionPointVisibility, true );
};

/**
 * Hides the insertion point for users.
 */
export const hideInsertionPoint = () => ( { set } ) => {
	set( insertionPointVisibility, false );
};

/**
 * Returns an action object resetting the template validity.
 *
 * @param {boolean}  isValid  template validity flag.
 */
export const setTemplateValidity = ( isValid ) => ( { set } ) => {
	set( templateValidity, isValid );
};

/**
 * Returns an action object synchronize the template with the list of blocks
 *
 * @return {Object} Action object.
 */
export const synchronizeTemplate = () => ( { get, set } ) => {
	const blocks = get( getBlocks() );
	const template = get( getTemplate() );
	const updatedBlockList = synchronizeBlocksWithTemplate( blocks, template );

	resetBlocks( updatedBlockList )( { get, set } );
};

/**
 * Returns an action object used in signalling that two blocks should be merged
 *
 * @param {string} clientIdA  Client ID of the first block to merge.
 * @param {string} clientIdB Client ID of the second block to merge.
 */
export const mergeBlocks = ( clientIdA, clientIdB ) => ( { get, set } ) => {
	const blockA = get( getBlock( clientIdA ) );
	const blockAType = getBlockType( blockA.name );

	// Only focus the previous block if it's not mergeable
	if ( ! blockAType.merge ) {
		selectBlock( blockA.clientId )( { get, set } );
		return;
	}

	const blockB = get( getBlock( clientIdB ) );
	const blockBType = getBlockType( blockB.name );
	const { clientId, attributeKey, offset } = get( getSelectionStart() );
	const selectedBlockType = clientId === clientIdA ? blockAType : blockBType;
	const attributeDefinition = selectedBlockType.attributes[ attributeKey ];
	const canRestoreTextSelection =
		( clientId === clientIdA || clientId === clientIdB ) &&
		attributeKey !== undefined &&
		offset !== undefined &&
		// We cannot restore text selection if the RichText identifier
		// is not a defined block attribute key. This can be the case if the
		// fallback intance ID is used to store selection (and no RichText
		// identifier is set), or when the identifier is wrong.
		!! attributeDefinition;

	if ( ! attributeDefinition ) {
		if ( typeof attributeKey === 'number' ) {
			window.console.error(
				`RichText needs an identifier prop that is the block attribute key of the attribute it controls. Its type is expected to be a string, but was ${ typeof attributeKey }`
			);
		} else {
			window.console.error(
				'The RichText identifier prop does not match any attributes defined by the block.'
			);
		}
	}

	// A robust way to retain selection position through various transforms
	// is to insert a special character at the position and then recover it.
	const START_OF_SELECTED_AREA = '\u0086';

	// Clone the blocks so we don't insert the character in a "live" block.
	const cloneA = cloneBlock( blockA );
	const cloneB = cloneBlock( blockB );

	if ( canRestoreTextSelection ) {
		const selectedBlock = clientId === clientIdA ? cloneA : cloneB;
		const html = selectedBlock.attributes[ attributeKey ];
		const {
			multiline: multilineTag,
			__unstableMultilineWrapperTags: multilineWrapperTags,
			__unstablePreserveWhiteSpace: preserveWhiteSpace,
		} = attributeDefinition;
		const value = insert(
			create( {
				html,
				multilineTag,
				multilineWrapperTags,
				preserveWhiteSpace,
			} ),
			START_OF_SELECTED_AREA,
			offset,
			offset
		);

		selectedBlock.attributes[ attributeKey ] = toHTMLString( {
			value,
			multilineTag,
			preserveWhiteSpace,
		} );
	}

	// We can only merge blocks with similar types
	// thus, we transform the block to merge first
	const blocksWithTheSameType =
		blockA.name === blockB.name
			? [ cloneB ]
			: switchToBlockType( cloneB, blockA.name );

	// If the block types can not match, do nothing
	if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
		return;
	}

	// Calling the merge to update the attributes and remove the block to be merged
	const updatedAttributes = blockAType.merge(
		cloneA.attributes,
		blocksWithTheSameType[ 0 ].attributes
	);

	if ( canRestoreTextSelection ) {
		const newAttributeKey = findKey(
			updatedAttributes,
			( v ) =>
				typeof v === 'string' &&
				v.indexOf( START_OF_SELECTED_AREA ) !== -1
		);
		const convertedHtml = updatedAttributes[ newAttributeKey ];
		const {
			multiline: multilineTag,
			__unstableMultilineWrapperTags: multilineWrapperTags,
			__unstablePreserveWhiteSpace: preserveWhiteSpace,
		} = blockAType.attributes[ newAttributeKey ];
		const convertedValue = create( {
			html: convertedHtml,
			multilineTag,
			multilineWrapperTags,
			preserveWhiteSpace,
		} );
		const newOffset = convertedValue.text.indexOf( START_OF_SELECTED_AREA );
		const newValue = remove( convertedValue, newOffset, newOffset + 1 );
		const newHtml = toHTMLString( {
			value: newValue,
			multilineTag,
			preserveWhiteSpace,
		} );

		updatedAttributes[ newAttributeKey ] = newHtml;

		selectionChange(
			blockA.clientId,
			newAttributeKey,
			newOffset,
			newOffset
		)( { get, set } );
	}

	replaceBlocks(
		[ blockA.clientId, blockB.clientId ],
		[
			{
				...blockA,
				attributes: {
					...blockA.attributes,
					...updatedAttributes,
				},
			},
			...blocksWithTheSameType.slice( 1 ),
		]
	)( { get, set } );
};

/**
 * Returns an action object used in signalling that the inner blocks with the
 * specified client ID should be replaced.
 *
 * @param {string}   rootClientId    Client ID of the block whose InnerBlocks will re replaced.
 * @param {Object[]} blocks          Block objects to insert as new InnerBlocks
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to false.
 */
export const replaceInnerBlocks = (
	rootClientId,
	blocks,
	updateSelection = false
) => ( { get, set } ) => {
	// TODO
};

/**
 * Returns an action object used to toggle the block editing mode between
 * visual and HTML modes.
 *
 * @param {string} clientId Block client ID.
 */
export const toggleBlockMode = ( clientId ) => ( { get, set } ) => {
	const currentModes = get( blocksModeByClientId );
	set( blocksModeByClientId, {
		...currentModes,
		[ clientId ]:
			currentModes[ clientId ] && currentModes[ clientId ] === 'html'
				? 'visual'
				: 'html',
	} );
};

/**
 * Returns an action object used in signalling that the user has begun to type.
 */
export const startTyping = () => ( { set } ) => {
	set( isTyping, true );
};

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object} Action object.
 */
export const stopTyping = () => ( { set } ) => {
	set( isTyping, false );
};

/**
 * Returns an action object used in signalling that the user has begun to drag blocks.
 *
 * @param {string[]} clientIds An array of client ids being dragged
 *
 * @return {Object} Action object.
 */
export const startDraggingBlocks = ( clientIds = [] ) => ( { set } ) => {
	set( draggedBlocks, clientIds );
};

/**
 * Returns an action object used in signalling that the user has stopped dragging blocks.
 *
 * @return {Object} Action object.
 */
export const stopDraggingBlocks = () => ( { set } ) => {
	set( draggedBlocks, [] );
};

/**
 * Returns an action object used in signalling that the caret has entered formatted text.
 */
export const enterFormattedText = () => ( { set } ) => {
	set( isCaretWithinFormattedText, true );
};

/**
 * Returns an action object used in signalling that the user caret has exited formatted text.
 */
export const exitFormattedText = () => ( { set } ) => {
	set( isCaretWithinFormattedText, false );
};

/**
 * Returns an action object used in signalling that the user caret has changed
 * position.
 *
 * @param {string} clientId     The selected block client ID.
 * @param {string} attributeKey The selected block attribute key.
 * @param {number} startOffset  The start offset.
 * @param {number} endOffset    The end offset.
 */
export const selectionChange = (
	clientId,
	attributeKey,
	startOffset,
	endOffset
) => ( { set } ) => {
	set( selectionStart, {
		clientId,
		attributeKey,
		offset: startOffset,
	} );
	set( selectionEnd, {
		clientId,
		attributeKey,
		offset: endOffset,
	} );
};

/**
 * Returns an action object used in signalling that a new block of the default
 * type should be added to the block list.
 *
 * @param {?Object} attributes   Optional attributes of the block to assign.
 * @param {?string} rootClientId Optional root client ID of block list on which
 *                               to append.
 * @param {?number} index        Optional index where to insert the default block
 */
export const insertDefaultBlock = ( attributes, rootClientId, index ) => ( {
	get,
	set,
} ) => {
	// Abort if there is no default block type (if it has been unregistered).
	const defaultBlockName = getDefaultBlockName();
	if ( ! defaultBlockName ) {
		return;
	}

	const block = createBlock( defaultBlockName, attributes );

	return insertBlock( block, index, rootClientId )( { get, set } );
};

/**
 * Returns an action object that changes the nested settings of a given block.
 *
 * @param {string} clientId         Client ID of the block whose nested setting are
 *                                  being received.
 * @param {Object} newBlockSettings Object with the new settings for the nested block.
 */
export const updateBlockListSettings = ( clientId, newBlockSettings ) => ( {
	get,
	set,
} ) => {
	const currentSettings = get( blockListSettingsByClientId );
	if ( ! newBlockSettings ) {
		if ( currentSettings.hasOwnProperty( clientId ) ) {
			set(
				blockListSettingsByClientId,
				omit( currentSettings, clientId )
			);
		}

		return;
	}

	if ( isEqual( currentSettings[ clientId ], newBlockSettings ) ) {
		return;
	}

	set( blockListSettingsByClientId, {
		...currentSettings,
		[ clientId ]: newBlockSettings,
	} );
};

/**
 * Returns an action object used in signalling that the block editor settings have been updated.
 *
 * @param {Object} newSettings Updated settings
 */
export const updateSettings = ( newSettings ) => ( { get, set } ) => {
	set( settings, {
		...get( settings ),
		...newSettings,
	} );
};

/**
 * Returns an action object used in signalling that a temporary reusable blocks have been saved
 * in order to switch its temporary id with the real id.
 *
 * @param {string} id        Reusable block's id.
 * @param {string} updatedId Updated block's id.
 *
 * @return {Object} Action object.
 */
export const __unstableSaveReusableBlock = ( id, updatedId ) => ( {
	get,
	set,
} ) => {
	// If a temporary reusable block is saved, we swap the temporary id with the final one
	if ( id === updatedId ) {
		return;
	}

	const blockMetadata = get( blockMetadataByClientId );
	set(
		blockAttributesByClientId,
		mapValues( get( blockMetadataByClientId ), ( attributes, clientId ) => {
			const { name } = blockMetadata[ clientId ];
			if ( name === 'core/block' && attributes.ref === id ) {
				return {
					...attributes,
					ref: updatedId,
				};
			}

			return attributes;
		} )
	);
};

/**
 * Returns an action object used in signalling that the last block change should be marked explicitly as persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkLastChangeAsPersistent() {
	return { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' };
}

/**
 * Returns an action object used in signalling that the next block change should be marked explicitly as not persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkNextChangeAsNotPersistent() {
	return { type: 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT' };
}

/**
 * Returns an action object used in signalling that the last block change is
 * an automatic change, meaning it was not performed by the user, and can be
 * undone using the `Escape` and `Backspace` keys. This action must be called
 * after the change was made, and any actions that are a consequence of it, so
 * it is recommended to be called at the next idle period to ensure all
 * selection changes have been recorded.
 *
 * @return {Object} Action object.
 */
export function* __unstableMarkAutomaticChange() {
	yield { type: 'MARK_AUTOMATIC_CHANGE' };
	const {
		setTimeout,
		requestIdleCallback = ( callback ) => setTimeout( callback, 100 ),
	} = window;

	requestIdleCallback( () => {
		yield { type: 'MARK_AUTOMATIC_CHANGE_FINAL' } );
	} );
}

/**
 * Generators that triggers an action used to enable or disable the navigation mode.
 *
 * @param {string} _isNavigationMode Enable/Disable navigation mode.
 */
export const setNavigationMode = ( _isNavigationMode = true ) => ( {
	set,
} ) => {
	set( isNavigationMode, _isNavigationMode );

	if ( _isNavigationMode ) {
		speak(
			__(
				'You are currently in navigation mode. Navigate blocks using the Tab key and Arrow keys. Use Left and Right Arrow keys to move between nesting levels. To exit navigation mode and edit the selected block, press Enter.'
			)
		);
	} else {
		speak(
			__(
				'You are currently in edit mode. To return to the navigation mode, press Escape.'
			)
		);
	}
};

/**
 * Generator that triggers an action used to enable or disable the block moving mode.
 *
 * @param {string|null} _hasBlockMovingClientId Enable/Disable block moving mode.
 */
export const setBlockMovingClientId = ( _hasBlockMovingClientId = null ) => ( {
	set,
} ) => {
	set( hasBlockMovingClientId, _hasBlockMovingClientId );
	if ( _hasBlockMovingClientId ) {
		speak(
			__(
				'Use the Tab key and Arrow keys to choose new block location. Use Left and Right Arrow keys to move between nesting levels. Once location is selected press Enter or Space to move the block.'
			)
		);
	}
};

/**
 * Generator that triggers an action used to duplicate a list of blocks.
 *
 * @param {string[]} clientIds
 * @param {boolean} updateSelection
 */
export const duplicateBlocks = ( clientIds, updateSelection = true ) => ( {
	get,
	set,
} ) => {
	if ( ! clientIds && ! clientIds.length ) {
		return;
	}
	const blocks = get( getBlocksByClientId( clientIds ) );
	// Return early if blocks don't exist.
	if ( some( blocks, ( block ) => ! block ) ) {
		return;
	}
	const blockNames = blocks.map( ( block ) => block.name );
	// Return early if blocks don't support multiple usage.
	if (
		some(
			blockNames,
			( blockName ) => ! hasBlockSupport( blockName, 'multiple', true )
		)
	) {
		return;
	}

	const rootClientId = get( getBlockRootClientId( clientIds[ 0 ] ) );
	const lastSelectedIndex = get(
		getBlockIndex( last( castArray( clientIds ) ), rootClientId )
	);
	const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
	insertBlocks(
		clonedBlocks,
		lastSelectedIndex + 1,
		rootClientId,
		updateSelection
	)( { get, set } );
	if ( clonedBlocks.length > 1 && updateSelection ) {
		multiSelect(
			first( clonedBlocks ).clientId,
			last( clonedBlocks ).clientId
		)( { get, set } );
	}
	return clonedBlocks.map( ( block ) => block.clientId );
};

/**
 * Generator used to insert an empty block after a given block.
 *
 * @param {string} clientId
 */
export const insertBeforeBlock = ( clientId ) => ( { get, set } ) => {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = get( getBlockRootClientId( clientId ) );
	const isLocked = get( getTemplateLock( rootClientId ) );
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = get( getBlockIndex( clientId, rootClientId ) );
	return insertDefaultBlock(
		{},
		rootClientId,
		firstSelectedIndex
	)( { get, set } );
};

/**
 * Generator used to insert an empty block before a given block.
 *
 * @param {string} clientId
 */
export const insertAfterBlock = ( clientId ) => ( { get, set } ) => {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = get( getBlockRootClientId( clientId ) );
	const isLocked = get( getTemplateLock( rootClientId ) );
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = get( getBlockIndex( clientId, rootClientId ) );
	return insertDefaultBlock(
		{},
		rootClientId,
		firstSelectedIndex + 1
	)( { get, set } );
};

/**
 * Returns an action object that toggles the highlighted block state.
 *
 * @param {string} clientId The block's clientId.
 * @param {boolean} isHighlighted The highlight state.
 */
export const toggleBlockHighlight = ( clientId, isHighlighted ) => ( {
	get,
	set,
} ) => {
	if ( isHighlighted ) {
		return set( highlightedBlock, clientId );
	} else if ( get( highlightedBlock ) === clientId ) {
		return set( highlightedBlock, null );
	}
};

/**
 * Yields action objects used in signalling that the block corresponding to the
 * given clientId should appear to "flash" by rhythmically highlighting it.
 *
 * @param {string} clientId Target block client ID.
 */
export const flashBlock = ( clientId ) => ( { get, set } ) => {
	toggleBlockHighlight( clientId, true )( { get, set } );
	setTimeout( () => {
		toggleBlockHighlight( clientId, false );
	}, 150 );
};

/**
 * Returns an action object that sets whether the block has controlled innerblocks.
 *
 * @param {string} clientId The block's clientId.
 * @param {boolean} hasControlledInnerBlocks True if the block's inner blocks are controlled.
 */
export const setHasControlledInnerBlocks = (
	clientId,
	hasControlledInnerBlocks
) => ( { get, set } ) => {
	set( controlledInnerBlocks, {
		...get( controlledInnerBlocks ),
		[ clientId ]: hasControlledInnerBlocks,
	} );
};
