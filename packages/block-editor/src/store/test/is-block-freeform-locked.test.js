import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { isBlockFreeformLocked } from '../private-selectors';
import { sectionRootClientIdKey } from '../private-keys';

// The feature is behind an experiment, which the selector reads off `window`.
// This suite runs in the node environment, so there is no window to read until
// one is put there.
beforeAll( () => {
	globalThis.window = globalThis.window ?? {};
	globalThis.window.__experimentalEnableFreeformCanvas = true;
	for ( const [ name, supports ] of Object.entries( ALL_TYPES ) ) {
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
	delete globalThis.window.__experimentalEnableFreeformCanvas;
	for ( const name of Object.keys( ALL_TYPES ) ) {
		unregisterBlockType( name );
	}
} );

// Every block type these tests mention, with the layout support that decides
// whether a section can be a canvas.
const ALL_TYPES = {
	'core/group': { layout: { allowSizingOnChildren: true } },
	'core/column': { layout: true },
	'core/columns': { layout: { allowSwitching: false } },
	'core/paragraph': {},
	'core/heading': {},
	'core/post-content': { layout: true },
	'core/buttons': { layout: { allowSwitching: false } },
	'core/button': {},
	'core/template-part': {},
};

const state = ( { parentLayout, entered = null } ) => ( {
	blockListSettings: new Map(),
	settings: {},
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
		blockEditingModes: new Map(),
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

	it( 'locks a block in a section that could be a canvas but is not one yet', () => {
		// A Group laid out `constrained` has not been dragged in, but it can
		// hold a canvas, so its blocks are held still from the start: that is
		// what gives them the move cursor and makes the whole block the drag
		// handle before anything has been converted.
		expect(
			isBlockFreeformLocked(
				state( { parentLayout: { type: 'constrained' } } ),
				'child'
			)
		).toBe( true );
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
const treeState = ( nodes, entered = null, sectionRoot = undefined ) => ( {
	blockListSettings: new Map(),
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
		blockEditingModes: new Map(),
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
	const PADDED = { style: { spacing: { padding: { top: '2rem' } } } };

	it( 'locks an item in a column of a section that is a canvas', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inColumns( { type: 'freeform' } ) ),
				'item'
			)
		).toBe( true );
	} );

	it( 'locks it even before the section has been converted', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inColumns( { type: 'constrained' } ) ),
				'item'
			)
		).toBe( true );
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
	// A section that could be a canvas holds its blocks still from the start,
	// so they show the move cursor and take one press to select and another to
	// type in. Waiting for the first drag meant an untouched section looked
	// like ordinary text and gave no sign it could be rearranged.
	const unconverted = [
		{
			clientId: 'sec',
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
		},
		{ clientId: 'item', name: 'core/paragraph', parent: 'sec' },
	];

	it( 'locks a block in a section that has not been converted', () => {
		expect(
			isBlockFreeformLocked( treeState( unconverted ), 'item' )
		).toBe( true );
	} );

	it( 'locks one in a section with no layout attribute at all', () => {
		const nodes = [
			{ clientId: 'sec', name: 'core/group' },
			{ clientId: 'item', name: 'core/paragraph', parent: 'sec' },
		];
		expect( isBlockFreeformLocked( treeState( nodes ), 'item' ) ).toBe(
			true
		);
	} );

	it( 'leaves a section alone that arranges its own children', () => {
		// A top-level Columns is not a canvas — it exists to arrange things —
		// so its columns are ordinary blocks and the text in them is text.
		const nodes = [
			{ clientId: 'sec', name: 'core/columns' },
			{ clientId: 'col', name: 'core/column', parent: 'sec' },
		];
		expect( isBlockFreeformLocked( treeState( nodes ), 'col' ) ).toBe(
			false
		);
	} );

	it( 'does nothing at all when the experiment is off', () => {
		// Without this guard every Group in every post would need two clicks
		// before you could type in it.
		delete globalThis.window.__experimentalEnableFreeformCanvas;
		const locked = isBlockFreeformLocked(
			treeState( unconverted ),
			'item'
		);
		globalThis.window.__experimentalEnableFreeformCanvas = true;
		expect( locked ).toBe( false );
	} );

	it( 'leaves a section alone that cannot be edited normally', () => {
		// Content-only and disabled sections are not the canvas's to rearrange,
		// and holding their text still would stop it being edited at all.
		const contentOnly = treeState( unconverted );
		contentOnly.blocks.blockEditingModes = new Map( [
			[ 'sec', 'contentOnly' ],
		] );
		expect( isBlockFreeformLocked( contentOnly, 'item' ) ).toBe( false );
	} );

	it( 'leaves a locked-down template section alone', () => {
		const lockedDown = treeState( unconverted );
		lockedDown.blockListSettings = new Map( [
			[ 'sec', { templateLock: 'all' } ],
		] );
		expect( isBlockFreeformLocked( lockedDown, 'item' ) ).toBe( false );
	} );

	it( 'still unlocks the block you have entered', () => {
		expect(
			isBlockFreeformLocked( treeState( unconverted, 'item' ), 'item' )
		).toBe( false );
	} );
} );

describe( 'isBlockFreeformLocked, inside a block that arranges its children', () => {
	// A Buttons block moves as one piece: it is what the canvas places, and
	// what a press anywhere on it picks up. But every pixel you can press
	// belongs to a Button's label, so if that label stays editable the press
	// puts a caret in it and no move ever starts. The same goes for a Gallery's
	// images and a Navigation's links.
	const inButtons = ( sectionLayout ) => [
		{
			clientId: 'sec',
			name: 'core/group',
			attributes: { layout: sectionLayout },
		},
		{ clientId: 'buttons', name: 'core/buttons', parent: 'sec' },
		{ clientId: 'button', name: 'core/button', parent: 'buttons' },
	];

	it( 'locks the button inside it, not just the Buttons block', () => {
		const withButtons = treeState( inButtons( { type: 'freeform' } ) );
		expect( isBlockFreeformLocked( withButtons, 'buttons' ) ).toBe( true );
		expect( isBlockFreeformLocked( withButtons, 'button' ) ).toBe( true );
	} );

	it( 'does the same before the section has been converted', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inButtons( { type: 'constrained' } ) ),
				'button'
			)
		).toBe( true );
	} );

	it( 'still unlocks the button once you have entered it', () => {
		expect(
			isBlockFreeformLocked(
				treeState( inButtons( { type: 'freeform' } ), 'button' ),
				'button'
			)
		).toBe( false );
	} );

	it( 'leaves a card’s contents alone, which is a different thing', () => {
		// A Group with padding is a box on the canvas, not an arrangement of
		// its children: the paragraph inside it is an ordinary block and its
		// words are ordinary words.
		const nodes = [
			{
				clientId: 'sec',
				name: 'core/group',
				attributes: { layout: { type: 'freeform' } },
			},
			{
				clientId: 'card',
				name: 'core/group',
				parent: 'sec',
				attributes: {
					style: { spacing: { padding: { top: '2rem' } } },
				},
			},
			{ clientId: 'inside', name: 'core/paragraph', parent: 'card' },
		];
		expect( isBlockFreeformLocked( treeState( nodes ), 'inside' ) ).toBe(
			false
		);
	} );
} );
