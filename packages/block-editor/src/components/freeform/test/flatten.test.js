import { describe, expect, it } from 'vitest';
import {
	hasVisualStyling,
	isAbsorbable,
	isArrangedContainer,
	isGridOfContainers,
	planSectionFlatten,
} from '../flatten';

const block = ( clientId, name, innerBlocks = [], attributes = {} ) => ( {
	clientId,
	name,
	innerBlocks,
	attributes,
} );
// A Group that looks like something: a card with padding, not scaffolding.
const styledGroup = ( clientId, innerBlocks = [] ) =>
	block( clientId, 'core/group', innerBlocks, {
		style: { spacing: { padding: { top: '2rem' } } },
	} );

// The layout supports that matter, copied from the blocks themselves.
const SUPPORTS = {
	'core/group': { allowSizingOnChildren: true },
	'core/column': true,
	'core/columns': {
		allowSwitching: false,
		allowInheriting: false,
		allowEditing: false,
		default: { type: 'flex', flexWrap: 'nowrap' },
	},
	'core/buttons': {
		allowSwitching: false,
		allowInheriting: false,
		default: { type: 'flex' },
	},
	'core/gallery': {
		allowSwitching: false,
		allowInheriting: false,
		allowSizingOnChildren: true,
		default: { type: 'flex' },
	},
	'core/navigation': {
		allowSwitching: false,
		allowInheriting: false,
		allowSizingOnChildren: true,
		default: { type: 'flex' },
	},
	'core/paragraph': undefined,
	'core/button': undefined,
	'core/image': undefined,
	'core/navigation-link': undefined,
};
const getLayoutSupport = ( name ) => SUPPORTS[ name ];

const canDissolve = ( candidate, parent ) =>
	isAbsorbable( candidate, parent, getLayoutSupport );

describe( 'isGridOfContainers', () => {
	it( 'recognises Columns: it arranges its children, and they hold blocks', () => {
		expect(
			isGridOfContainers(
				block( 'cols', 'core/columns', [
					block( 'c1', 'core/column' ),
					block( 'c2', 'core/column' ),
				] ),
				getLayoutSupport
			)
		).toBe( true );
	} );

	it.each( [
		[ 'core/buttons', 'core/button' ],
		[ 'core/gallery', 'core/image' ],
		[ 'core/navigation', 'core/navigation-link' ],
	] )(
		'leaves %s alone: it arranges its children, but they are not containers',
		( name, childName ) => {
			expect(
				isGridOfContainers(
					block( 'w', name, [ block( 'a', childName ) ] ),
					getLayoutSupport
				)
			).toBe( false );
		}
	);

	it( 'leaves a Group alone: it does not arrange its children at all', () => {
		expect(
			isGridOfContainers(
				block( 'g', 'core/group', [ block( 'c', 'core/column' ) ] ),
				getLayoutSupport
			)
		).toBe( false );
	} );

	it( 'is false for a wrapper with nothing in it', () => {
		expect(
			isGridOfContainers(
				block( 'cols', 'core/columns' ),
				getLayoutSupport
			)
		).toBe( false );
	} );
} );

describe( 'planSectionFlatten', () => {
	it( 'leaves a section of plain blocks exactly as it is', () => {
		const section = block( 'sec', 'core/group', [
			block( 'a', 'core/paragraph' ),
			block( 'b', 'core/paragraph' ),
		] );

		expect( planSectionFlatten( section, canDissolve ) ).toEqual( {
			citizens: [ 'a', 'b' ],
			wrappers: [],
		} );
	} );

	it( 'hoists the contents of every column, and names the columns they leave', () => {
		const section = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					block( 'a', 'core/paragraph' ),
					block( 'b', 'core/paragraph' ),
				] ),
				block( 'c2', 'core/column', [
					block( 'c', 'core/paragraph' ),
				] ),
			] ),
		] );

		expect( planSectionFlatten( section, canDissolve ) ).toEqual( {
			citizens: [ 'a', 'b', 'c' ],
			wrappers: [
				{
					clientId: 'cols',
					moves: [
						{ clientIds: [ 'a', 'b' ], fromRootClientId: 'c1' },
						{ clientIds: [ 'c' ], fromRootClientId: 'c2' },
					],
				},
			],
		} );
	} );

	it( 'keeps document order when a Columns sits between plain blocks', () => {
		const section = block( 'sec', 'core/group', [
			block( 'before', 'core/paragraph' ),
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					block( 'a', 'core/paragraph' ),
				] ),
			] ),
			block( 'after', 'core/paragraph' ),
		] );

		expect( planSectionFlatten( section, canDissolve ).citizens ).toEqual( [
			'before',
			'a',
			'after',
		] );
	} );

	it( 'hoists a styled Group out of a column whole, keeping it a box', () => {
		// It carries padding, so it is something you can see rather than
		// scaffolding. It comes out of the column as one block and what is
		// inside it is left alone.
		const section = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					styledGroup( 'card', [
						block( 'deep', 'core/paragraph' ),
					] ),
				] ),
			] ),
		] );

		const plan = planSectionFlatten( section, canDissolve );
		expect( plan.citizens ).toEqual( [ 'card' ] );
		expect( plan.wrappers[ 0 ].moves ).toEqual( [
			{ clientIds: [ 'card' ], fromRootClientId: 'c1' },
		] );
	} );

	it( 'dissolves an unstyled Group in a column and takes its contents', () => {
		// Patterns wrap column contents in a bare Group all the time. It is
		// scaffolding, so the section absorbs it and what was inside joins the
		// one grid.
		const section = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					block( 'wrapper', 'core/group', [
						block( 'heading', 'core/heading' ),
						block( 'deep', 'core/paragraph' ),
					] ),
				] ),
			] ),
		] );

		const plan = planSectionFlatten( section, canDissolve );
		expect( plan.citizens ).toEqual( [ 'heading', 'deep' ] );
		expect( plan.wrappers[ 0 ].moves ).toEqual( [
			{ clientIds: [ 'heading', 'deep' ], fromRootClientId: 'wrapper' },
		] );
	} );

	it( 'dissolves a bare wrapper Group sitting straight in the section', () => {
		const section = block( 'sec', 'core/group', [
			block( 'wrapper', 'core/group', [
				block( 'a', 'core/paragraph' ),
			] ),
			styledGroup( 'card', [ block( 'b', 'core/paragraph' ) ] ),
		] );

		expect( planSectionFlatten( section, canDissolve ) ).toEqual( {
			citizens: [ 'a', 'card' ],
			wrappers: [
				{
					clientId: 'wrapper',
					moves: [
						{ clientIds: [ 'a' ], fromRootClientId: 'wrapper' },
					],
				},
			],
		} );
	} );

	it( 'absorbs a column’s contents even when the column itself is padded', () => {
		// A column is scaffolding whatever it carries: it only exists to put
		// things side by side, which is the arrangement being replaced.
		const section = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block(
					'c1',
					'core/column',
					[ block( 'a', 'core/paragraph' ) ],
					{ style: { spacing: { padding: { top: '2rem' } } } }
				),
			] ),
		] );

		expect( planSectionFlatten( section, canDissolve ).citizens ).toEqual( [
			'a',
		] );
	} );

	it( 'dissolves a Columns nested inside a column too, removing only the outer one', () => {
		const section = block( 'sec', 'core/group', [
			block( 'outer', 'core/columns', [
				block( 'oc1', 'core/column', [
					block( 'inner', 'core/columns', [
						block( 'ic1', 'core/column', [
							block( 'deep', 'core/paragraph' ),
						] ),
					] ),
				] ),
				block( 'oc2', 'core/column', [
					block( 'plain', 'core/paragraph' ),
				] ),
			] ),
		] );

		// Removing the outer Columns takes the inner one with it, so only the
		// outer one is named — but `deep` has to be moved out of its own
		// column, not out of the one the inner Columns sat in.
		expect( planSectionFlatten( section, canDissolve ) ).toEqual( {
			citizens: [ 'deep', 'plain' ],
			wrappers: [
				{
					clientId: 'outer',
					moves: [
						{ clientIds: [ 'deep' ], fromRootClientId: 'ic1' },
						{ clientIds: [ 'plain' ], fromRootClientId: 'oc2' },
					],
				},
			],
		} );
	} );

	it( 'drops a Columns whose columns are all empty', () => {
		const section = block( 'sec', 'core/group', [
			block( 'a', 'core/paragraph' ),
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column' ),
				block( 'c2', 'core/column' ),
			] ),
		] );

		// An empty Columns is still a grid inside the section, so it goes —
		// there is simply nothing to hoist out of it first.
		expect( planSectionFlatten( section, canDissolve ) ).toEqual( {
			citizens: [ 'a' ],
			wrappers: [ { clientId: 'cols', moves: [] } ],
		} );
	} );

	it( 'handles a section with nothing in it', () => {
		expect(
			planSectionFlatten( block( 'sec', 'core/group' ), canDissolve )
		).toEqual( { citizens: [], wrappers: [] } );
	} );

	it( 'reports whether there is anything to do', () => {
		const flat = block( 'sec', 'core/group', [
			block( 'a', 'core/paragraph' ),
		] );
		const nested = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					block( 'a', 'core/paragraph' ),
				] ),
			] ),
		] );

		expect( planSectionFlatten( flat, canDissolve ).wrappers ).toHaveLength(
			0
		);
		expect(
			planSectionFlatten( nested, canDissolve ).wrappers
		).toHaveLength( 1 );
	} );
} );

describe( 'isArrangedContainer', () => {
	it( 'is true for a column, which is one cell of a Columns', () => {
		expect(
			isArrangedContainer(
				SUPPORTS[ 'core/column' ],
				SUPPORTS[ 'core/columns' ]
			)
		).toBe( true );
	} );

	it( 'is false for a Group in a Group: both are canvases in their own right', () => {
		expect(
			isArrangedContainer(
				SUPPORTS[ 'core/group' ],
				SUPPORTS[ 'core/group' ]
			)
		).toBe( false );
	} );

	it( 'is false for a section, which has no container above it', () => {
		expect(
			isArrangedContainer( SUPPORTS[ 'core/group' ], undefined )
		).toBe( false );
	} );

	it( 'is false for a Button in a Buttons: it is not a container at all', () => {
		expect(
			isArrangedContainer(
				SUPPORTS[ 'core/button' ],
				SUPPORTS[ 'core/buttons' ]
			)
		).toBe( false );
	} );
} );

describe( 'hasVisualStyling', () => {
	it.each( [
		[ 'padding', { style: { spacing: { padding: { top: '2rem' } } } } ],
		[ 'a background colour', { backgroundColor: 'primary' } ],
		[ 'a custom background', { style: { color: { background: '#fff' } } } ],
		[ 'a gradient', { gradient: 'vivid-cyan-blue-to-vivid-purple' } ],
		[
			'a background image',
			{ style: { background: { backgroundImage: {} } } },
		],
		[ 'a border', { style: { border: { width: '1px' } } } ],
		[ 'a border colour', { borderColor: 'accent' } ],
		[
			'a minimum height',
			{ style: { dimensions: { minHeight: '33vh' } } },
		],
		[ 'a shadow', { style: { shadow: 'var:preset|shadow|natural' } } ],
	] )( 'sees a Group with %s', ( _label, attributes ) => {
		expect( hasVisualStyling( attributes ) ).toBe( true );
	} );

	it.each( [
		[ 'nothing at all', {} ],
		[ 'only a block gap', { style: { spacing: { blockGap: '1rem' } } } ],
		[ 'only an alignment', { align: 'full' } ],
		[ 'only a layout', { layout: { type: 'constrained' } } ],
		[ 'only a name', { metadata: { name: 'Wrapper' } } ],
	] )( 'sees scaffolding in a Group with %s', ( _label, attributes ) => {
		// `blockGap` spaces out what is inside and leaves no mark of its own,
		// and the positions captured on conversion already account for it.
		expect( hasVisualStyling( attributes ) ).toBe( false );
	} );

	it( 'copes with a block that has no attributes', () => {
		expect( hasVisualStyling( undefined ) ).toBe( false );
	} );
} );

describe( 'a Row or a Stack', () => {
	// Both are a Group with a flex layout, and both exist to arrange what is
	// in them — side by side, or one above the next. That arrangement is the
	// thing a canvas replaces, so the canvas absorbs them as it does a Columns,
	// whatever they are styled with. A Group that merely holds its blocks in
	// flow is a different thing and stays whole if it has a look of its own.
	const PADDED = { style: { spacing: { padding: { top: '2rem' } } } };
	const row = ( clientId, attributes = {} ) =>
		block( clientId, 'core/group', [ block( 'a', 'core/paragraph' ) ], {
			...attributes,
			layout: { type: 'flex', orientation: 'horizontal' },
		} );
	const stack = ( clientId, attributes = {} ) =>
		block( clientId, 'core/group', [ block( 'a', 'core/paragraph' ) ], {
			...attributes,
			layout: { type: 'flex', orientation: 'vertical' },
		} );
	const section = ( child ) => block( 'sec', 'core/group', [ child ] );

	it( 'dissolves a Row', () => {
		expect(
			planSectionFlatten( section( row( 'r' ) ), canDissolve ).wrappers
		).toHaveLength( 1 );
	} );

	it( 'dissolves a Stack', () => {
		expect(
			planSectionFlatten( section( stack( 's' ) ), canDissolve ).wrappers
		).toHaveLength( 1 );
	} );

	it( 'dissolves a Row even when it is padded', () => {
		// A Columns is absorbed however it is styled, and a Row is the same
		// kind of thing.
		const plan = planSectionFlatten(
			section( row( 'r', PADDED ) ),
			canDissolve
		);
		expect( plan.wrappers ).toHaveLength( 1 );
		expect( plan.citizens ).toEqual( [ 'a' ] );
	} );

	it( 'dissolves a Grid group too', () => {
		const grid = block(
			'g',
			'core/group',
			[ block( 'a', 'core/paragraph' ) ],
			{ ...PADDED, layout: { type: 'grid' } }
		);
		expect(
			planSectionFlatten( section( grid ), canDissolve ).wrappers
		).toHaveLength( 1 );
	} );

	it( 'still keeps a padded Group that only holds its blocks in flow', () => {
		const card = block(
			'card',
			'core/group',
			[ block( 'a', 'core/paragraph' ) ],
			{ ...PADDED, layout: { type: 'constrained' } }
		);
		const plan = planSectionFlatten( section( card ), canDissolve );
		expect( plan.wrappers ).toHaveLength( 0 );
		expect( plan.citizens ).toEqual( [ 'card' ] );
	} );
} );
