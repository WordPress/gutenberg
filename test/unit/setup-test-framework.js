// `babel-jest` should be doing this instead, but apparently it's not working.
require( 'core-js/modules/es7.object.values' );

/**
 * External dependencies
 */
import Adapter from 'enzyme-adapter-react-16';
import Enzyme from 'enzyme';
import 'jest-enzyme';

Enzyme.configure( { adapter: new Adapter() } );

// Sets spies on console object to make it possible to convert them into test failures.
const spyError = jest.spyOn( console, 'error' );
const spyWarn = jest.spyOn( console, 'warn' );

beforeEach( () => {
	spyError.mockReset();
	spyWarn.mockReset();
} );

afterEach( () => {
	expect( spyError ).not.toHaveBeenCalled();
	expect( spyWarn ).not.toHaveBeenCalled();
} );
