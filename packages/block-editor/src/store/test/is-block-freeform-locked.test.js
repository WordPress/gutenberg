import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { isBlockFreeformLocked } from '../private-selectors';
import { sectionRootClientIdKey } from '../private-keys';

const state = ( { parentLayout, entered = null } ) => ( {
	blocks: {
		parents: new Map( [ [ 'child', 'canvas' ] ] ),
		order: new Map( [
			[ '', [ 'canvas' ] ],
			[ 'canvas', [ 'child' ] ],
			[ 'child', [] ],
		] ),
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

const treeState = ( nodes, entered = null, sectionRoot = undefined ) => ( {
	settings: sectionRoot ? { [ sectionRootClientIdKey ]: sectionRoot } : {},
	blocks: {
		parents: new Map(
			nodes.map( ( { clientId, parent } ) => [ clientId, parent ?? '' ] )
		),
		// `order` is how the real store answers "what is in this block", which
		// the walk needs to tell a Columns from any other arranging block.
		order: new Map(
			nodes.map( ( { clientId } ) => [
				clientId,
				nodes
					.filter( ( n ) => ( n.parent ?? '' ) === clientId )
					.map( ( n ) => n.clientId ),
			] )
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

describe( 'isBlockFreeformLocked, through what the canvas absorbs', () => {
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

	const PADDED = { style: { spacing: { padding: { top: '2rem' } } } };

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

	it( 'reaches through a bare wrapper Group in a column', () => {
		// The pattern wrapper the canvas dissolves: what is inside it lands on
		// the section's canvas, so it is held still like any other block there.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'cols', name: 'core/columns', parent: 'sec' },
			{ clientId: 'col', name: 'core/column', parent: 'cols' },
			{ clientId: 'wrapper', name: 'core/group', parent: 'col' },
			{ clientId: 'heading', name: 'core/heading', parent: 'wrapper' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'heading' ) ).toBe(
			true
		);
	} );

	it( 'leaves the text inside a card editable, and locks the card', () => {
		// A padded Group is a box on the canvas: it is dragged as one, so the
		// card is held still and the words inside it are still words.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'cols', name: 'core/columns', parent: 'sec' },
			{ clientId: 'col', name: 'core/column', parent: 'cols' },
			{
				clientId: 'card',
				name: 'core/group',
				parent: 'col',
				attributes: PADDED,
			},
			{ clientId: 'inside', name: 'core/paragraph', parent: 'card' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'card' ) ).toBe(
			true
		);
		expect( isBlockFreeformLocked( treeState( nodes ), 'inside' ) ).toBe(
			false
		);
	} );

	it( 'never steps over the section itself, however plain it is', () => {
		// The top-level Group has no styling, which would make it absorbable
		// anywhere else. It is the canvas, so the walk has to stop there.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'item', name: 'core/paragraph', parent: 'sec' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'item' ) ).toBe(
			true
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

describe( 'isBlockFreeformLocked, where sections are not top-level', () => {
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
		registerBlockType( 'core/post-content', {
			apiVersion: 3,
			title: 'Content',
			category: 'theme',
			supports: { layout: true },
			save: () => null,
		} );
		registerBlockType( 'core/template-part', {
			apiVersion: 3,
			title: 'Template Part',
			category: 'theme',
			supports: {},
			save: () => null,
		} );
	} );

	afterAll( () => {
		for ( const name of Object.keys( TYPES ) ) {
			unregisterBlockType( name );
		}
		unregisterBlockType( 'core/post-content' );
		unregisterBlockType( 'core/template-part' );
	} );

	// What the site editor actually renders for a page: the template's parts
	// and wrapper are the top-level blocks, and the page's sections are the
	// children of the Post Content block, which the editor names as the
	// section root.
	const siteEditorTree = ( sectionLayout ) => [
		{ clientId: 'header', name: 'core/template-part' },
		{ clientId: 'wrapper', name: 'core/group' },
		{ clientId: 'content', name: 'core/post-content', parent: 'wrapper' },
		{
			clientId: 'sec',
			name: 'core/group',
			parent: 'content',
			attributes: { layout: sectionLayout },
		},
		{ clientId: 'item', name: 'core/paragraph', parent: 'sec' },
	];

	it( 'locks a block in a section inside the Post Content', () => {
		// The section is two levels down, so "top-level" would never find it
		// and nothing in a site-editor page would be draggable at all.
		expect(
			isBlockFreeformLocked(
				treeState(
					siteEditorTree( { type: 'freeform' } ),
					null,
					'content'
				),
				'item'
			)
		).toBe( true );
	} );

	it( 'leaves it alone when that section is not a canvas', () => {
		expect(
			isBlockFreeformLocked(
				treeState(
					siteEditorTree( { type: 'constrained' } ),
					null,
					'content'
				),
				'item'
			)
		).toBe( false );
	} );

	it( 'does not treat the template wrapper as a section', () => {
		// The wrapper is top-level and holds blocks, so without the section
		// root it looks exactly like a section — and converting it would take
		// the header and footer with it.
		const nodes = [
			{
				clientId: 'wrapper',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{
				clientId: 'content',
				name: 'core/post-content',
				parent: 'wrapper',
			},
			{ clientId: 'loose', name: 'core/paragraph', parent: 'wrapper' },
		];

		expect(
			isBlockFreeformLocked(
				treeState( nodes, null, 'content' ),
				'loose'
			)
		).toBe( false );
	} );

	it( 'still treats a top-level block as the section with no section root', () => {
		// The post editor, where the section root is simply not set.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{ clientId: 'item', name: 'core/paragraph', parent: 'sec' },
		];

		expect( isBlockFreeformLocked( treeState( nodes ), 'item' ) ).toBe(
			true
		);
	} );
} );
