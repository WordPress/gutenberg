import { describe, expect, it } from 'vitest';
import {
	isArrangedContainer,
	isGridOfContainers,
	planSectionFlatten,
} from '../flatten';

const block = ( clientId, name, innerBlocks = [] ) => ( {
	clientId,
	name,
	innerBlocks,
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

const canDissolve = ( candidate ) =>
	isGridOfContainers( candidate, getLayoutSupport );

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

	it( 'hoists a Group out of a column whole, leaving what is inside it alone', () => {
		const section = block( 'sec', 'core/group', [
			block( 'cols', 'core/columns', [
				block( 'c1', 'core/column', [
					block( 'g', 'core/group', [
						block( 'deep', 'core/paragraph' ),
					] ),
				] ),
			] ),
		] );

		const plan = planSectionFlatten( section, canDissolve );
		expect( plan.citizens ).toEqual( [ 'g' ] );
		expect( plan.wrappers[ 0 ].moves ).toEqual( [
			{ clientIds: [ 'g' ], fromRootClientId: 'c1' },
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
