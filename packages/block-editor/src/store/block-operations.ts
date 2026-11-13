import type { BlockOperation } from '@wordpress/blocks';
import type { Action, BlocksState, Reducer, State, TreeBlock } from './types';

interface ScopedOperation {
	controller: string;
	operation: BlockOperation;
}

export interface BlockOperationChange {
	revision: number;
	// Undefined invalidates operation delivery, including unsupported and
	// incoming edits. A partial operation batch must never replace a state edit.
	operations?: ScopedOperation[];
}

function getController( blocks: BlocksState, parent: string ): string {
	while ( parent && ! blocks.controlledInnerBlocks.has( parent ) ) {
		parent = blocks.parents.get( parent ) ?? '';
	}
	return parent;
}

function getAttributeOperations(
	previous: BlocksState,
	next: BlocksState,
	clientId: string,
	keys: string[]
): ScopedOperation[] {
	const oldAttributes = previous.attributes.get( clientId );
	const attributes = next.attributes.get( clientId );
	if ( ! oldAttributes || ! attributes ) {
		return [];
	}
	const controller = getController(
		next,
		next.parents.get( clientId ) ?? ''
	);
	return keys
		.filter(
			( key ) => ! Object.is( oldAttributes[ key ], attributes[ key ] )
		)
		.map( ( attribute ) => ( {
			controller,
			operation: {
				type: 'set-attribute',
				clientId,
				attribute,
				previousValue: oldAttributes[ attribute ],
				value: attributes[ attribute ],
			},
		} ) );
}

// A split of a leaf block retains the head's identity and inserts a new tail.
// Capture the replacement action, rather than infer a split from two trees.
function getReplacementOperations(
	previous: BlocksState,
	next: BlocksState,
	clientIds: string[],
	blocks: TreeBlock[]
): ScopedOperation[] | undefined {
	if ( clientIds.length !== 1 || ! blocks.length ) {
		return;
	}
	const sourceId = clientIds[ 0 ];
	const parent = previous.parents.get( sourceId );
	if (
		parent === undefined ||
		previous.controlledInnerBlocks.has( sourceId ) ||
		previous.order.get( sourceId )?.length
	) {
		return;
	}
	const source = previous.byClientId.get( sourceId );
	const head = next.byClientId.get( sourceId );
	if (
		! source ||
		! head ||
		blocks[ 0 ].clientId !== sourceId ||
		blocks[ 0 ].innerBlocks.length ||
		Object.keys( { ...source, ...head } ).some(
			( key ) =>
				! Object.is(
					source[ key as keyof typeof source ],
					head[ key as keyof typeof head ]
				)
		)
	) {
		return;
	}
	const tail = blocks.slice( 1 );
	const insertions = tail.length
		? getOperations( previous, next, {
				type: 'INSERT_BLOCKS',
				blocks: tail,
				rootClientId: parent,
			} )
		: [];
	if ( ! insertions ) {
		return;
	}
	const keys = Object.keys( {
		...previous.attributes.get( sourceId ),
		...next.attributes.get( sourceId ),
	} );
	return [
		...getAttributeOperations( previous, next, sourceId, keys ),
		...insertions,
	];
}

function getOperations(
	previous: BlocksState,
	next: BlocksState,
	action: Action
): ScopedOperation[] | undefined {
	if ( next.isIgnoredChange ) {
		return;
	}
	if ( action.type === 'UPDATE_BLOCK_ATTRIBUTES' ) {
		return action.clientIds.flatMap( ( clientId ) =>
			getAttributeOperations(
				previous,
				next,
				clientId,
				Object.keys(
					( action.options?.uniqueByBlock
						? ( action.attributes?.[ clientId ] as object )
						: action.attributes ) ?? {}
				)
			)
		);
	}
	if (
		action.type === 'UPDATE_BLOCK' &&
		Object.keys( action.updates ).every( ( key ) => key === 'attributes' )
	) {
		return getAttributeOperations(
			previous,
			next,
			action.clientId,
			Object.keys( action.updates.attributes ?? {} )
		);
	}
	if ( action.type === 'REPLACE_BLOCKS' ) {
		return getReplacementOperations(
			previous,
			next,
			action.clientIds,
			action.blocks
		);
	}
	if ( action.type === 'REMOVE_BLOCKS' ) {
		const removed = new Set( action.clientIds );
		return action.clientIds
			.filter( ( id ) => {
				if (
					! previous.byClientId.has( id ) ||
					next.byClientId.has( id )
				) {
					return false;
				}
				let parent = previous.parents.get( id );
				while ( parent ) {
					if ( removed.has( parent ) ) {
						return false;
					}
					parent = previous.parents.get( parent );
				}
				return true;
			} )
			.map( ( clientId ) => ( {
				controller: getController(
					previous,
					previous.parents.get( clientId ) ?? ''
				),
				operation: { type: 'remove', clientId },
			} ) );
	}

	let ids: string[];
	let parent: string;
	if ( action.type === 'INSERT_BLOCKS' ) {
		ids = action.blocks.map( ( block ) => block.clientId );
		parent = action.rootClientId ?? '';
		// Reusing IDs can replace existing blocks, not just insert new ones.
		const pending = [ ...action.blocks ];
		const insertedIds = new Set< string >();
		while ( pending.length ) {
			const block = pending.pop()!;
			if (
				previous.byClientId.has( block.clientId ) ||
				insertedIds.has( block.clientId )
			) {
				return;
			}
			insertedIds.add( block.clientId );
			pending.push( ...block.innerBlocks );
		}
	} else if ( action.type === 'MOVE_BLOCKS_TO_POSITION' ) {
		ids = action.clientIds;
		parent = action.toRootClientId ?? '';
	} else if (
		action.type === 'MOVE_BLOCKS_UP' ||
		action.type === 'MOVE_BLOCKS_DOWN'
	) {
		ids = action.clientIds;
		parent = action.rootClientId ?? '';
	} else {
		return;
	}

	const order = next.order.get( parent ) ?? [];
	const positions = new Map( order.map( ( id, index ) => [ id, index ] ) );
	if ( ids.some( ( id ) => ! positions.has( id ) ) ) {
		return;
	}
	const controller = getController( next, parent );
	if (
		action.type !== 'INSERT_BLOCKS' &&
		ids.some(
			( id ) =>
				getController( previous, previous.parents.get( id ) ?? '' ) !==
				controller
		)
	) {
		// A move between entities is not a move within a shared document.
		return;
	}
	if ( action.type !== 'INSERT_BLOCKS' ) {
		const source =
			previous.order.get( previous.parents.get( ids[ 0 ] ) ?? '' ) ?? [];
		const start = source.indexOf( ids[ 0 ] );
		if (
			start === -1 ||
			ids.some( ( id, index ) => source[ start + index ] !== id )
		) {
			// The reducer moves a contiguous slice. Do not report a different
			// set of IDs when a caller supplies a noncontiguous selection.
			return;
		}
	}
	// Use the accepted order, including normalized/clamped insertion indexes.
	// Work from right to left so every anchor exists when it is referenced.
	const selected = new Set( ids );
	return order
		.filter( ( id ) => selected.has( id ) )
		.reverse()
		.map( ( clientId ) => {
			const position = {
				parent: parent === controller ? null : parent,
				before: order[ positions.get( clientId )! + 1 ] ?? null,
			};
			return {
				controller,
				operation:
					action.type === 'INSERT_BLOCKS'
						? {
								type: 'insert',
								block: next.tree.get( clientId ) as TreeBlock,
								...position,
							}
						: { type: 'move', clientId, ...position },
			};
		} );
}

/**
 * Keep enough accepted edits to span batched subscriber notifications.
 * @param reducer The editor reducer.
 */
export function withBlockOperations(
	reducer: Reducer< State >
): Reducer< State > {
	return ( state, action ) => {
		const next = reducer( state, action );
		if ( ! state ) {
			return next;
		}
		const changes = state.blockOperationChanges ?? [];
		if ( state.blocks.tree === next.blocks.tree ) {
			next.blockOperationChanges = state.blockOperationChanges;
			return next;
		}
		return {
			...next,
			blockOperationChanges: [
				...changes.slice( -63 ),
				{
					revision: ( changes.at( -1 )?.revision ?? 0 ) + 1,
					operations: getOperations(
						state.blocks,
						next.blocks,
						action
					),
				},
			],
		};
	};
}

/**
 * Undefined requests producer-side conversion from blocks, including log gaps.
 * @param changes    Recent accepted changes.
 * @param revision   Last revision observed by this subscriber.
 * @param controller Controller whose operations are requested.
 */
export function getBlockOperationsSince(
	changes: BlockOperationChange[] | undefined,
	revision: number,
	controller: string
): BlockOperation[] | undefined {
	const pending = changes?.filter( ( change ) => change.revision > revision );
	if (
		! pending?.length ||
		pending[ 0 ].revision !== revision + 1 ||
		pending.some( ( change ) => ! change.operations )
	) {
		return;
	}
	const operations = pending
		.flatMap( ( change ) => change.operations! )
		.filter( ( operation ) => operation.controller === controller )
		.map( ( operation ) => operation.operation );
	return operations.length ? operations : undefined;
}
