/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import Editable from '../';

describe( 'Editable', () => {
	describe( '.propTypes', () => {
		/* eslint-disable no-console */
		let consoleError;
		beforeEach( () => {
			consoleError = console.error;
			console.error = jest.fn();
		} );

		afterEach( () => {
			console.error = consoleError;
		} );

		it( 'should not warn when rendered with string value', () => {
			shallow( <Editable value="Uh oh!" /> );

			expect( console.error ).not.toHaveBeenCalled();
		} );

		it( 'should not warn when rendered with undefined value', () => {
			shallow( <Editable /> );

			expect( console.error ).not.toHaveBeenCalled();
		} );

		it( 'should warn when rendered with array value', () => {
			shallow( <Editable value={ [ 'Oh, no' ] } /> );

			expect( console.error ).toHaveBeenCalled();
		} );
		/* eslint-enable no-console */
	} );
} );
