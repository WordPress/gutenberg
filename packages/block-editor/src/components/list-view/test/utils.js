/**
 * Internal dependencies
 */
import { getCommonDepthClientIds } from '../utils';

describe( 'getCommonDepthClientIds', () => {
	it( 'should return start and end when no depth is provided', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[],
			[]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return deepest start and end when depths match', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1', 'start-2', 'start-3' ],
			[ 'end-1', 'end-2', 'end-3' ]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return shallower ids when start is shallower', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1' ],
			[ 'end-1', 'end-2', 'end-3' ]
		);

		expect( result ).toEqual( { start: 'start-id', end: 'end-2' } );
	} );

	it( 'should return shallower ids when end is shallower', () => {
		const result = getCommonDepthClientIds(
			'start-id',
			'clicked-id',
			[ 'start-1', 'start-2', 'start-3' ],
			[ 'end-1', 'end-2' ]
		);

		expect( result ).toEqual( { start: 'start-3', end: 'clicked-id' } );
	} );
} );
