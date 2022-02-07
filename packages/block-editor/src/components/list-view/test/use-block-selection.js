/**
 * Internal dependencies
 */
import { getStartAndEndIds } from '../use-block-selection';

describe( 'getStartAndEndIds', () => {
	it( 'should return start and end when no depth is provided', () => {
		const result = getStartAndEndIds( {
			blockSelectionStart: 'start-id',
			clientId: 'clicked-id',
			endParents: [],
			startParents: [],
		} );

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return deepest start and end when depths match', () => {
		const result = getStartAndEndIds( {
			blockSelectionStart: 'start-id',
			clientId: 'clicked-id',
			endParents: [ 'end-1', 'end-2', 'end-3' ],
			startParents: [ 'start-1', 'start-2', 'start-3' ],
		} );

		expect( result ).toEqual( { start: 'start-id', end: 'clicked-id' } );
	} );

	it( 'should return shallower ids when start is shallower', () => {
		const result = getStartAndEndIds( {
			blockSelectionStart: 'start-id',
			clientId: 'clicked-id',
			endParents: [ 'end-1', 'end-2', 'end-3' ],
			startParents: [ 'start-1' ],
		} );

		expect( result ).toEqual( { start: 'start-id', end: 'end-2' } );
	} );

	it( 'should return shallower ids when end is shallower', () => {
		const result = getStartAndEndIds( {
			blockSelectionStart: 'start-id',
			clientId: 'clicked-id',
			endParents: [ 'end-1', 'end-2' ],
			startParents: [ 'start-1', 'start-2', 'start-3' ],
		} );

		expect( result ).toEqual( { start: 'start-3', end: 'clicked-id' } );
	} );
} );
