/**
 * Internal dependencies
 */
import { buildStateSelector } from '../state-utils';

describe( 'buildStateSelector', () => {
	const BASE = '.wp-elements-abc123';

	it( 'scopes state to each element selector part when statesElement is "button"', () => {
		// ELEMENTS['button'] = '.wp-element-button, .wp-block-button__link'
		expect( buildStateSelector( BASE, 'button', ':hover' ) ).toBe(
			`${ BASE } .wp-element-button:hover, ${ BASE } .wp-block-button__link:hover`
		);
	} );

	it( 'works for :focus and :active states', () => {
		expect( buildStateSelector( BASE, 'button', ':focus' ) ).toBe(
			`${ BASE } .wp-element-button:focus, ${ BASE } .wp-block-button__link:focus`
		);
		expect( buildStateSelector( BASE, 'button', ':active' ) ).toBe(
			`${ BASE } .wp-element-button:active, ${ BASE } .wp-block-button__link:active`
		);
	} );

	it( 'scopes state to the single element selector when statesElement is "link"', () => {
		// ELEMENTS['link'] = 'a:where(:not(.wp-element-button))'
		expect( buildStateSelector( BASE, 'link', ':hover' ) ).toBe(
			`${ BASE } a:where(:not(.wp-element-button)):hover`
		);
	} );

	it( 'falls back to appending state to the base selector when statesElement is null', () => {
		expect( buildStateSelector( BASE, null, ':hover' ) ).toBe(
			`${ BASE }:hover`
		);
	} );

	it( 'falls back to appending state to the base selector when statesElement is undefined', () => {
		expect( buildStateSelector( BASE, undefined, ':hover' ) ).toBe(
			`${ BASE }:hover`
		);
	} );

	it( 'falls back to appending state to the base selector when statesElement has no matching ELEMENTS entry', () => {
		expect( buildStateSelector( BASE, 'unknown-element', ':hover' ) ).toBe(
			`${ BASE }:hover`
		);
	} );
} );
