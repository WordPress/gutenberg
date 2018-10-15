/**
 * Internal dependencies
 */
import { isAction, isSpecificAction } from '../is-action';

const nonActions = [
	null,
	[],
	42,
	'foo',
	function() {},
	{ foo: 'bar' },
];
const validAction = { type: 'winner' };

describe( 'isAction()', () => {
	it( 'should return false if not an action', () => {
		nonActions.forEach( ( value ) => {
			expect( isAction( value ) ).toBe( false );
		} );
	} );
	it( 'should return true if an action', () => {
		expect( isAction( validAction ) ).toBe( true );
	} );
} );

describe( 'isSpecificAction', () => {
	it( 'should return false if not an action', () => {
		nonActions.forEach( ( value ) => {
			expect( isSpecificAction( value, 'foo' ) ).toBe( false );
		} );
	} );
	it( 'should return false if is an action but not of correct type', () => {
		expect( isSpecificAction( validAction, 'loser' ) ).toBe( false );
	} );
	it( 'should return true if is an action and of correct type', () => {
		expect( isSpecificAction( validAction, 'winner' ) ).toBe( true );
	} );
} );
