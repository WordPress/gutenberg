/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	RawHTMLWithWarning,
	shimRawHTML,
} from '../deprecated';

describe( 'deprecated', () => {
	describe( 'RawHTMLWithWarning', () => {
		it( 'warns on mount', () => {
			shallow( <RawHTMLWithWarning /> );

			expect( console ).toHaveWarned();
		} );

		it( 'renders RawHTML', () => {
			const wrapper = shallow(
				<RawHTMLWithWarning>
					Scary!
				</RawHTMLWithWarning>
			);

			expect( console ).toHaveWarned();
			expect( wrapper.name() ).toBe( 'RawHTML' );
			expect( wrapper.find( 'RawHTML' ).prop( 'children' ) ).toBe( 'Scary!' );
		} );
	} );

	describe( 'shimRawHTML()', () => {
		it( 'should do nothing to elements', () => {
			const original = createElement( 'div' );
			const result = shimRawHTML( original );

			expect( result ).toBe( original );
		} );

		it( 'should do nothing to non-HTML strings', () => {
			const original = 'Not so scary';
			const result = shimRawHTML( original );

			expect( result ).toBe( original );
		} );

		it( 'replace HTML strings with RawHTMLWithWarning', () => {
			const original = '<p>So scary!</p>';
			const result = shimRawHTML( original );

			expect( result.type ).toBe( RawHTMLWithWarning );
			expect( result.props.children ).toBe( original );
		} );

		it( 'replace shortcode strings with RawHTMLWithWarning', () => {
			const original = '[myshortcode]Hello[/myshortcode]';
			const result = shimRawHTML( original );

			expect( result.type ).toBe( RawHTMLWithWarning );
			expect( result.props.children ).toBe( original );
		} );
	} );
} );
