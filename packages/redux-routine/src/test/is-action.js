/**
 * Internal dependencies
 */
import { isAction, isActionOfType } from '../is-action';

const nonActions = [ null, [], 42, 'foo', () => {}, { foo: 'bar' } ];
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

describe( 'isActionOfType', () => {
	it( 'should return false if not an action', () => {
		nonActions.forEach( ( value ) => {
			expect( isActionOfType( value, 'foo' ) ).toBe( false );
		} );
	} );
	it( 'should return false if is an action but not of correct type', () => {
		expect( isActionOfType( validAction, 'loser' ) ).toBe( false );
	} );
	it( 'should return true if is an action and of correct type', () => {
		expect( isActionOfType( validAction, 'winner' ) ).toBe( true );
	} );
} );
