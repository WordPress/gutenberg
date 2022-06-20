/**
 * Internal dependencies
 */
import {
	__experimentalRetrieveSelectedAttribute,
	__EXPERIMENTAL_START_OF_SELECTED_AREA,
} from '../selection';

describe( '__experimentalRetrieveSelectedAttribute', () => {
	it( 'returns undefined if block attributes are not an object', () => {
		expect(
			__experimentalRetrieveSelectedAttribute( undefined )
		).toBeUndefined();
		expect(
			__experimentalRetrieveSelectedAttribute( null )
		).toBeUndefined();
	} );

	it( 'returns the block attribute name if it contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this${ __EXPERIMENTAL_START_OF_SELECTED_AREA }is selected`,
		};
		expect(
			__experimentalRetrieveSelectedAttribute( blockAttributes )
		).toBe( 'bar' );
	} );

	it( 'returns the first block attribute that contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this${ __EXPERIMENTAL_START_OF_SELECTED_AREA }is selected`,
			baz: `this${ __EXPERIMENTAL_START_OF_SELECTED_AREA }is selected`,
		};
		expect(
			__experimentalRetrieveSelectedAttribute( blockAttributes )
		).toBe( 'bar' );
	} );

	it( 'returns undefined if no block attribute contains the selection position character', () => {
		const blockAttributes = {
			foo: `this is not selected`,
			bar: `this is not selected either`,
		};
		expect(
			__experimentalRetrieveSelectedAttribute( blockAttributes )
		).toBeUndefined();
	} );
} );
