/**
 * Internal dependencies
 */
import {
	retrieveSelectedAttribute,
	START_OF_SELECTED_AREA,
} from '../selection';

describe( 'retrieveSelectedAttribute', () => {
	it( 'returns undefined if block attributes are not an object', () => {
		expect( retrieveSelectedAttribute( undefined ) ).toBeUndefined();
		expect( retrieveSelectedAttribute( null ) ).toBeUndefined();
	} );

	it( 'returns the block attribute name if it contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this${ START_OF_SELECTED_AREA }is selected`,
		};
		expect( retrieveSelectedAttribute( blockAttributes ) ).toBe( 'bar' );
	} );

	it( 'returns the first block attribute that contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this${ START_OF_SELECTED_AREA }is selected`,
			baz: `this${ START_OF_SELECTED_AREA }is selected`,
		};
		expect( retrieveSelectedAttribute( blockAttributes ) ).toBe( 'bar' );
	} );

	it( 'returns undefined if no block attribute contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this is not selected either`,
		};
		expect( retrieveSelectedAttribute( blockAttributes ) ).toBeUndefined();
	} );
} );
