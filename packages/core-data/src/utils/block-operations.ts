import type { Block, BlockOperation } from '@wordpress/blocks';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

type Parent = string | null;
interface Node {
	block: Block;
	parent: Parent;
}

function indexTree(
	blocks: Block[],
	parent: Parent,
	nodes: Map< string, Node >
) {
	for ( const block of blocks ) {
		nodes.set( block.clientId, { block, parent } );
		indexTree( block.innerBlocks, block.clientId, nodes );
	}
}

/**
 * Translate a state-based block setter into identity-based operations.
 * Normal editor actions bypass this conversion and supply their operations.
 * Retained children move out of deleted parents before those parents disappear.
 *
 * @param previous Previous editor blocks, with the same IDs the engine loaded.
 * @param next     Accepted block value.
 * @return Ordered operations that produce the accepted value.
 */
export function diffBlockOperations(
	previous: Block[],
	next: Block[]
): BlockOperation[] {
	if ( previous === next ) {
		return [];
	}
	const oldNodes = new Map< string, Node >();
	const newNodes = new Map< string, Node >();
	indexTree( previous, null, oldNodes );
	indexTree( next, null, newNodes );
	const parents = new Map(
		[ ...oldNodes ].map( ( [ id, node ] ) => [ id, node.parent ] )
	);
	const orders = new Map< Parent, string[] >( [
		[ null, previous.map( ( block ) => block.clientId ) ],
	] );
	for ( const [ id, { block } ] of oldNodes ) {
		orders.set(
			id,
			block.innerBlocks.map( ( child ) => child.clientId )
		);
	}
	const operations: BlockOperation[] = [];
	const detach = ( id: string ) => {
		const order = orders.get( parents.get( id )! )!;
		order.splice( order.indexOf( id ), 1 );
	};
	// Preorder ensures destination parents exist and have moved before children.
	for ( const [ id, { block, parent } ] of newNodes ) {
		const old = oldNodes.get( id )?.block;
		if ( ! old ) {
			operations.push( {
				type: 'insert',
				block: { ...block, innerBlocks: [] },
				parent,
				before: null,
			} );
			orders.set( id, [] );
		} else if ( parents.get( id ) !== parent ) {
			operations.push( {
				type: 'move',
				clientId: id,
				parent,
				before: null,
			} );
			detach( id );
		}
		if ( ! old || parents.get( id ) !== parent ) {
			orders.get( parent )!.push( id );
			parents.set( id, parent );
		}
		if ( ! old || old === block ) {
			continue;
		}
		for ( const property of Object.keys( { ...old, ...block } ) as Array<
			keyof Block
		> ) {
			if (
				property === 'clientId' ||
				property === 'innerBlocks' ||
				property === 'attributes'
			) {
				continue;
			}
			if ( ! Object.is( old[ property ], block[ property ] ) ) {
				operations.push( {
					type: 'set-block-property',
					clientId: id,
					property,
					previousValue: old[ property ],
					value: block[ property ],
				} );
			}
		}
		for ( const attribute of Object.keys( {
			...old.attributes,
			...block.attributes,
		} ) ) {
			if (
				! fastDeepEqual(
					old.attributes[ attribute ],
					block.attributes[ attribute ]
				)
			) {
				operations.push( {
					type: 'set-attribute',
					clientId: id,
					attribute,
					previousValue: old.attributes[ attribute ],
					value: block.attributes[ attribute ],
				} );
			}
		}
	}
	for ( const [ id ] of oldNodes ) {
		if ( newNodes.has( id ) ) {
			continue;
		}
		const parent = parents.get( id )!;
		if ( parent === null || newNodes.has( parent ) ) {
			operations.push( { type: 'remove', clientId: id } );
			detach( id );
		}
	}
	const reorder = ( blocks: Block[], parent: Parent ) => {
		const order = orders.get( parent )!;
		let before: string | null = null;
		for ( const block of [ ...blocks ].reverse() ) {
			const id = block.clientId;
			const index = order.indexOf( id );
			if ( ( order[ index + 1 ] ?? null ) !== before ) {
				operations.push( {
					type: 'move',
					clientId: id,
					parent,
					before,
				} );
				order.splice( index, 1 );
				order.splice(
					before === null ? order.length : order.indexOf( before ),
					0,
					id
				);
			}
			before = id;
			reorder( block.innerBlocks, id );
		}
	};
	reorder( next, null );
	return operations;
}
