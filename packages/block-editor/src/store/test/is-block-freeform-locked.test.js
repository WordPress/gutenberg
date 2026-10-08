import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { isBlockFreeformLocked } from '../private-selectors';

const state = ( { parentLayout, entered = null } ) => ( {
	blocks: {
		parents: new Map( [ [ 'child', 'canvas' ] ] ),
		byClientId: new Map( [
			[ 'canvas', { name: 'core/group' } ],
			[ 'child', { name: 'core/paragraph' } ],
		] ),
		attributes: new Map( [
			[ 'canvas', { layout: parentLayout } ],
			[ 'child', {} ],
		] ),
	},
	freeformEnteredBlock: entered,
} );

describe( 'isBlockFreeformLocked', () => {
	it( 'locks a block sitting on a canvas', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'freeform' } } ),
				'child'
			)
		).toBe( true );
	} );

	it( 'unlocks the block you have entered', () => {
		expect(
			isBlockFreeformLocked(
				state( {
					parentLayout: { type: 'freeform' },
					entered: 'child',
				} ),
				'child'
			)
		).toBe( false );
	} );

	it( 'still locks its siblings', () => {
		expect(
			isBlockFreeformLocked(
				state( {
					parentLayout: { type: 'freeform' },
					entered: 'somethingElse',
				} ),
				'child'
			)
		).toBe( true );
	} );

	it( 'leaves blocks that are not on a canvas alone', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'constrained' } } ),
				'child'
			)
		).toBe( false );
	} );

	it( 'leaves a top-level block alone', () => {
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'freeform' } } ),
				'canvas'
			)
		).toBe( false );
	} );
} );

// A block in a column belongs to the section's canvas, not to the column: the
// first drag dissolves the grid into the section. So the walk up to the canvas
// steps over the cells of a grid, and these are the block types it reads to
// know one when it sees it.
const TYPES = {
	'core/group': { layout: { allowSizingOnChildren: true } },
	'core/column': { layout: true },
	'core/columns': { layout: { allowSwitching: false } },
	'core/paragraph': {},
};

const treeState = ( nodes, entered = null ) => ( {
	blocks: {
		parents: new Map(
			nodes.map( ( { clientId, parent } ) => [ clientId, parent ?? '' ] )
		),
		byClientId: new Map(
			nodes.map( ( { clientId, name } ) => [ clientId, { name } ] )
		),
		attributes: new Map(
			nodes.map( ( { clientId, attributes } ) => [
				clientId,
				attributes ?? {},
			] )
		),
	},
	freeformEnteredBlock: entered,
} );

const inColumns = ( sectionLayout ) => [
	{
		clientId: 'sec',
		name: 'core/group',
		attributes: { layout: sectionLayout },
	},
	{ clientId: 'cols', name: 'core/columns', parent: 'sec' },
	{ clientId: 'col', name: 'core/column', parent: 'cols' },
	{ clientId: 'item', name: 'core/paragraph', parent: 'col' },
];

describe( 'isBlockFreeformLocked, through a grid of containers', () => {
	beforeAll( () => {
		for ( const [ name, supports ] of Object.entries( TYPES ) ) {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'text',
				supports,
				save: () => null,
			} );
		}
	} );

	afterAll( () => {
		for ( const name of Object.keys( TYPES ) ) {
			unregisterBlockType( name );
		}
	} );

	it( 'locks an item in a column of a section that is a canvas', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inColumns( { type: 'freeform' } ) ),
				'item'
			)
		).toBe( true );
	} );

	it( 'leaves it alone when the section is not a canvas', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inColumns( { type: 'constrained' } ) ),
				'item'
			)
		).toBe( false );
	} );

	it( 'unlocks the item you have entered', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inColumns( { type: 'freeform' } ), 'item' ),
				'item'
			)
		).toBe( false );
	} );

	it( 'does not lock what is inside a Group on a canvas', () => {
		// A Group is a canvas in its own right, not a cell: its contents are
		// laid out by the Group and are not the section's to place, so they
		// stay editable.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'inner', name: 'core/group', parent: 'sec' },
			{ clientId: 'deep', name: 'core/paragraph', parent: 'inner' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'inner' ) ).toBe(
			true
		);
		expect( isBlockFreeformLocked( treeState( nodes ), 'deep' ) ).toBe(
			false
		);
	} );

	it( 'reaches through a Columns nested in a column', () => {
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'outer', name: 'core/columns', parent: 'sec' },
			{ clientId: 'oc', name: 'core/column', parent: 'outer' },
			{ clientId: 'inner', name: 'core/columns', parent: 'oc' },
			{ clientId: 'ic', name: 'core/column', parent: 'inner' },
			{ clientId: 'deep', name: 'core/paragraph', parent: 'ic' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'deep' ) ).toBe(
			true
		);
	} );
} );
