import { describe, expect, it, vi } from 'vitest';
import type { WidgetType } from '@wordpress/widget-primitives';
import { enforceLayoutPolicy } from '../utils/enforce-layout-policy';
import type {
	CanPerformDashboardOperation,
	DashboardInstanceOperation,
	DashboardWidget,
} from '../types';

const widgetTypes: WidgetType[] = [
	{ apiVersion: 1, name: 'test/one', title: 'One', renderModule: 'one' },
	{ apiVersion: 1, name: 'test/two', title: 'Two', renderModule: 'two' },
];

const widget = (
	uuid: string,
	over: Partial< DashboardWidget > = {}
): DashboardWidget => ( {
	uuid,
	type: 'test/one',
	...over,
} );

/* Denies the listed operations, allows everything else. */
const deny =
	(
		...operations: DashboardInstanceOperation[]
	): CanPerformDashboardOperation =>
	( request ) =>
		! ( operations as string[] ).includes( request.operation );

const allowAll: CanPerformDashboardOperation = () => true;

const uuids = ( layout: DashboardWidget[] ) =>
	layout.map( ( { uuid } ) => uuid );

describe( 'enforceLayoutPolicy', () => {
	it( 'returns the incoming layout itself when the policy allows everything', () => {
		const previous = [ widget( 'a' ), widget( 'b' ) ];
		const next = [
			{ ...previous[ 1 ], placement: { width: 2 } },
			{ ...previous[ 0 ], attributes: { label: 'edited' } },
			widget( 'c' ),
		];

		const result = enforceLayoutPolicy( {
			previous,
			next,
			canPerform: allowAll,
			widgetTypes,
		} );

		expect( result ).toBe( next );
	} );

	it( 'asks with the previous instance and its resolved type', () => {
		const canPerform = vi.fn( allowAll );
		const previous = [ widget( 'a', { attributes: { label: 'one' } } ) ];
		const next = [ { ...previous[ 0 ], attributes: { label: 'two' } } ];

		enforceLayoutPolicy( { previous, next, canPerform, widgetTypes } );

		expect( canPerform ).toHaveBeenCalledWith( {
			operation: 'edit',
			widget: previous[ 0 ],
			widgetType: widgetTypes[ 0 ],
		} );
	} );

	describe( 'insert', () => {
		it( 'drops a new instance whose type the policy rejects', () => {
			const previous = [ widget( 'a' ) ];
			const next = [
				previous[ 0 ],
				widget( 'b', { type: 'test/two' } ),
				widget( 'c' ),
			];
			const rejectTwo: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'insert' &&
					request.widgetType.name === 'test/two'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: rejectTwo,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'a', 'c' ] );
		} );

		it( 'passes a new instance of an unregistered type through', () => {
			const previous = [ widget( 'a' ) ];
			const next = [
				previous[ 0 ],
				widget( 'b', { type: 'test/unknown' } ),
			];
			const rejectInserts: CanPerformDashboardOperation = ( request ) =>
				request.operation !== 'insert';

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: rejectInserts,
				widgetTypes,
			} );

			expect( result ).toBe( next );
		} );
	} );

	describe( 'unregistered type', () => {
		it( 'asks instance operations with widgetType absent', () => {
			const canPerform = vi.fn( allowAll );
			const previous = [ widget( 'a', { type: 'test/gone' } ) ];
			const next = [ { ...previous[ 0 ], attributes: { label: 'x' } } ];

			enforceLayoutPolicy( {
				previous,
				next,
				canPerform,
				widgetTypes,
			} );

			expect( canPerform ).toHaveBeenCalledWith( {
				operation: 'edit',
				widget: previous[ 0 ],
				widgetType: undefined,
			} );
		} );

		it( 'does not fire a lock keyed on the type', () => {
			const previous = [
				widget( 'a', { type: 'test/gone' } ),
				widget( 'b' ),
			];
			const next = [ previous[ 1 ], previous[ 0 ] ];
			const denyGoneMoves: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' &&
					request.widgetType?.name === 'test/gone'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: denyGoneMoves,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'b', 'a' ] );
		} );

		it( 'still holds a lock decided from the instance', () => {
			const previous = [
				widget( 'a', { type: 'test/gone' } ),
				widget( 'b' ),
			];
			const next = [ previous[ 1 ], previous[ 0 ] ];
			const pinA: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' &&
					'widget' in request &&
					request.widget.uuid === 'a'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinA,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'a', 'b' ] );
		} );
	} );

	describe( 'edit', () => {
		it( 're-asserts the staged attributes when edit is denied', () => {
			const previous = [
				widget( 'a', { attributes: { label: 'staged' } } ),
			];
			const next = [ { ...previous[ 0 ], attributes: { label: 'x' } } ];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'edit' ),
				widgetTypes,
			} );

			expect( result[ 0 ].attributes ).toBe( previous[ 0 ].attributes );
		} );

		it( 'strips attributes a denied edit introduced', () => {
			const previous = [ widget( 'a' ) ];
			const next = [ { ...previous[ 0 ], attributes: { label: 'x' } } ];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'edit' ),
				widgetTypes,
			} );

			expect( 'attributes' in result[ 0 ] ).toBe( false );
		} );

		it( 'leaves deep-equal attributes untouched under a denied edit', () => {
			const previous = [
				widget( 'a', { attributes: { label: 'same' } } ),
			];
			const next = [
				{ ...previous[ 0 ], attributes: { label: 'same' } },
			];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'edit' ),
				widgetTypes,
			} );

			expect( result ).toBe( next );
		} );
	} );

	describe( 'resize', () => {
		it( 're-asserts the placement spans when resize is denied', () => {
			const previous = [
				widget( 'a', { placement: { width: 1, height: 1 } } ),
			];
			const next = [
				{
					...previous[ 0 ],
					placement: { width: 3, height: 2, order: 5 },
				},
			];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'resize' ),
				widgetTypes,
			} );

			expect( result[ 0 ].placement ).toEqual( { width: 1, height: 1 } );
		} );

		it( 'drops spans a denied resize introduced on a bare instance', () => {
			const previous = [ widget( 'a' ) ];
			const next = [ { ...previous[ 0 ], placement: { width: 4 } } ];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'resize' ),
				widgetTypes,
			} );

			expect( 'placement' in result[ 0 ] ).toBe( false );
		} );
	} );

	describe( 'move', () => {
		it( 'holds the index of a move-denied instance through a reorder', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			const next = [ previous[ 2 ], previous[ 0 ], previous[ 1 ] ];
			const pinB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'b'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinB,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'c', 'b', 'a' ] );
		} );

		it( 'accepts a layout where the pinned instance already holds its index', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			// What the grid emits for "move a after c" while b is pinned.
			const next = [ previous[ 2 ], previous[ 1 ], previous[ 0 ] ];
			const pinB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'b'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinB,
				widgetTypes,
			} );

			expect( result ).toBe( next );
		} );

		it( 'discounts an allowed removal when holding the index', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			const next = [ previous[ 1 ], previous[ 2 ] ];
			const pinC: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'c'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinC,
				widgetTypes,
			} );

			expect( result ).toBe( next );
		} );

		it( 'reads a reorder the grid expressed through order fields', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			// The grid emits reorders in the old array order with fresh
			// `order` stamps: "move a after c" while b is pinned.
			const next = [
				{ ...previous[ 0 ], placement: { order: 2 } },
				{ ...previous[ 1 ], placement: { order: 1 } },
				{ ...previous[ 2 ], placement: { order: 0 } },
			];
			const pinB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'b'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinB,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'c', 'b', 'a' ] );
			expect( result[ 0 ].placement ).toEqual( {} );
		} );

		it( 'holds the canonical position through a reorder followed by a removal', () => {
			const previous = [
				widget( 'a' ),
				widget( 'b' ),
				widget( 'c' ),
				widget( 'd' ),
			];
			const pinB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'b'
				);

			// Grid emission for "move a after c" while b is pinned.
			const afterDrag = enforceLayoutPolicy( {
				previous,
				next: [
					{ ...previous[ 0 ], placement: { order: 2 } },
					{ ...previous[ 1 ], placement: { order: 1 } },
					{ ...previous[ 2 ], placement: { order: 0 } },
					{ ...previous[ 3 ], placement: { order: 3 } },
				],
				canPerform: pinB,
				widgetTypes,
			} );

			expect( uuids( afterDrag ) ).toEqual( [ 'c', 'b', 'a', 'd' ] );

			// Then remove the dragged tile: b keeps its second position.
			const afterRemoval = enforceLayoutPolicy( {
				previous: afterDrag,
				next: afterDrag.filter( ( { uuid } ) => uuid !== 'a' ),
				canPerform: pinB,
				widgetTypes,
			} );

			expect( uuids( afterRemoval ) ).toEqual( [ 'c', 'b', 'd' ] );
		} );

		it( 're-asserts a move expressed through order fields alone', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			const next = [
				previous[ 0 ],
				{ ...previous[ 1 ], placement: { order: 5 } },
				previous[ 2 ],
			];
			const pinB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'move' && request.widget.uuid === 'b'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: pinB,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'a', 'b', 'c' ] );
		} );

		it( 'keeps the lane of a move-denied instance', () => {
			const previous = [ widget( 'a', { placement: { lane: 0 } } ) ];
			const next = [ { ...previous[ 0 ], placement: { lane: 2 } } ];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: deny( 'move' ),
				widgetTypes,
			} );

			expect( result[ 0 ].placement ).toEqual( { lane: 0 } );
		} );
	} );

	describe( 'remove', () => {
		it( 're-asserts a denied removal at its previous index', () => {
			const previous = [ widget( 'a' ), widget( 'b' ), widget( 'c' ) ];
			const next = [ previous[ 0 ], previous[ 2 ] ];
			const lockB: CanPerformDashboardOperation = ( request ) =>
				! (
					request.operation === 'remove' &&
					request.widget.uuid === 'b'
				);

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: lockB,
				widgetTypes,
			} );

			expect( uuids( result ) ).toEqual( [ 'a', 'b', 'c' ] );
			expect( result[ 1 ] ).toBe( previous[ 1 ] );
		} );

		it( 'lets an allowed removal through', () => {
			const previous = [ widget( 'a' ), widget( 'b' ) ];
			const next = [ previous[ 1 ] ];

			const result = enforceLayoutPolicy( {
				previous,
				next,
				canPerform: allowAll,
				widgetTypes,
			} );

			expect( result ).toBe( next );
		} );
	} );

	it( 'enforces every facet of one staged layout at once', () => {
		const previous = [
			widget( 'locked', {
				attributes: { label: 'keep' },
				placement: { width: 1, height: 1 },
			} ),
			widget( 'free' ),
		];
		const next = [
			widget( 'added', { type: 'test/two' } ),
			previous[ 1 ],
			{
				...previous[ 0 ],
				attributes: { label: 'changed' },
				placement: { width: 4, height: 2 },
			},
		];
		const lockFirst: CanPerformDashboardOperation = ( request ) => {
			if ( request.operation === 'insert' ) {
				return request.widgetType.name !== 'test/two';
			}
			return ! (
				'widget' in request && request.widget.uuid === 'locked'
			);
		};

		const result = enforceLayoutPolicy( {
			previous,
			next,
			canPerform: lockFirst,
			widgetTypes,
		} );

		expect( uuids( result ) ).toEqual( [ 'locked', 'free' ] );
		expect( result[ 0 ].attributes ).toBe( previous[ 0 ].attributes );
		expect( result[ 0 ].placement ).toEqual( { width: 1, height: 1 } );
	} );

	it( 'lets a move-denied instance take an allowed resize', () => {
		const previous = [
			widget( 'a', { placement: { width: 1, height: 1 } } ),
			widget( 'b' ),
		];
		const next = [
			previous[ 1 ],
			{ ...previous[ 0 ], placement: { width: 3, height: 1 } },
		];
		const pinA: CanPerformDashboardOperation = ( request ) =>
			! ( request.operation === 'move' && request.widget.uuid === 'a' );

		const result = enforceLayoutPolicy( {
			previous,
			next,
			canPerform: pinA,
			widgetTypes,
		} );

		expect( uuids( result ) ).toEqual( [ 'a', 'b' ] );
		expect( result[ 0 ].placement ).toEqual( { width: 3, height: 1 } );
	} );
} );
