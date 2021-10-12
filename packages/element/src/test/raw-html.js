/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import RawHTML from '../raw-html';

describe( 'RawHTML', () => {
	it( 'is dangerous', () => {
		const html = '<p>So scary!</p>';
		const { container } = render( <RawHTML>{ html }</RawHTML> );
		const expected = '<div><p>So scary!</p></div>';

		expect( container.innerHTML ).toBe( expected );
	} );

	it( 'creates wrapper if assigned other props', () => {
		const html = '<p>So scary!</p>';
		const { container } = render(
			<RawHTML className="foo">{ html }</RawHTML>
		);

		expect( container.innerHTML ).toBe(
			'<div class="foo"><p>So scary!</p></div>'
		);
	} );

	it( 'concatenates children if multiple children present', () => {
		const html = '<p>So scary!</p>';
		const html2 = '<p>Extra paragraph</p>';

		const { container } = render(
			<RawHTML>
				{ html }
				{ html2 }
			</RawHTML>
		);

		const expected = '<div><p>So scary!</p><p>Extra paragraph</p></div>';
		expect( container.innerHTML ).toBe( expected );
	} );
} );
