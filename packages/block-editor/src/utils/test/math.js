/**
 * Internal dependencies
 */
import { getDistanceFromPointToEdge, getDistanceToNearestEdge } from '../math';

describe( 'getDistanceFromPointToEdge', () => {
	it( 'calculates the horizontal straight line distance when the point is adjacent to a vertical edge', () => {
		const point = { x: 0, y: 2 };
		const rect = {
			top: 0,
			bottom: 4,
			left: 2,
		};
		expect( getDistanceFromPointToEdge( point, rect, 'left' ) ).toBe( 2 );
	} );

	it( 'calculates the vertical straight line distance when the point is adjacent to a horizontal edge', () => {
		const point = { x: 2, y: 0 };
		const rect = {
			top: 2,
			left: 0,
			right: 4,
		};
		expect( getDistanceFromPointToEdge( point, rect, 'top' ) ).toBe( 2 );
	} );

	it( 'calculates the distance to the nearest corner that the edge forms when the point is not adjacent to a horizontal edge', () => {
		const point = { x: 0, y: 0 };
		const rect = {
			top: 1,
			left: 1,
			bottom: 4,
		};
		const distance = getDistanceFromPointToEdge( point, rect, 'left' );
		const fixedDistance = distance.toFixed( 2 );
		expect( fixedDistance ).toBe( '1.41' );
	} );

	it( 'calculates the distance to the nearest corner that the edge forms when the point is not adjacent to a vertical edge', () => {
		const point = { x: 0, y: 0 };
		const rect = {
			top: 1,
			left: 1,
			right: 4,
		};
		const distance = getDistanceFromPointToEdge( point, rect, 'top' );
		const fixedDistance = distance.toFixed( 2 );
		expect( fixedDistance ).toBe( '1.41' );
	} );
} );

describe( 'getDistanceToNearestEdge', () => {
	it( 'returns the correct distance to the top edge, when it is the closest edge', () => {
		const point = { x: 3, y: 0 };
		const rect = {
			top: 2,
			right: 4,
			bottom: 4,
			left: 2,
		};
		expect( getDistanceToNearestEdge( point, rect ) ).toEqual( [
			2,
			'top',
		] );
	} );

	it( 'returns the correct distance to the left edge, when it is the closest edge', () => {
		const point = { x: 0, y: 3 };
		const rect = {
			top: 2,
			right: 4,
			bottom: 4,
			left: 2,
		};
		expect( getDistanceToNearestEdge( point, rect ) ).toEqual( [
			2,
			'left',
		] );
	} );

	it( 'returns the correct distance to the right edge, when it is the closest edge', () => {
		const point = { x: 6, y: 3 };
		const rect = {
			top: 2,
			right: 4,
			bottom: 4,
			left: 2,
		};
		expect( getDistanceToNearestEdge( point, rect ) ).toEqual( [
			2,
			'right',
		] );
	} );

	it( 'returns the correct distance to the bottom edge, when it is the closest edge', () => {
		const point = { x: 3, y: 6 };
		const rect = {
			top: 2,
			right: 4,
			bottom: 4,
			left: 2,
		};
		expect( getDistanceToNearestEdge( point, rect ) ).toEqual( [
			2,
			'bottom',
		] );
	} );

	it( 'allows a list of edges to be provided as the third argument', () => {
		// Position is closer to right edge, but right edge is not an allowed edge.
		const point = { x: 4, y: 2.5 };
		const rect = {
			top: 2,
			right: 4,
			bottom: 4,
			left: 2,
		};
		expect(
			getDistanceToNearestEdge( point, rect, [ 'top', 'bottom' ] )
		).toEqual( [ 0.5, 'top' ] );
	} );
} );
