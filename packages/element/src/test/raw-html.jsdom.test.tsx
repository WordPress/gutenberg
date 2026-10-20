import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import RawHTML from '../raw-html';

describe( 'RawHTML', () => {
	it( 'is dangerous', () => {
		const html = '<p>So scary!</p>';
		const { container } = render( <RawHTML>{ html }</RawHTML> );
		const expected = '<div><p>So scary!</p></div>';

		expect( container.innerHTML ).toBe( expected );
	} );

	it( 'adds other props to container element', () => {
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

	it( 'renders an empty container if there are no children', () => {
		const { container } = render(
			// @ts-expect-error Missing children test the empty container.
			<RawHTML></RawHTML>
		);

		const expected = '<div></div>';
		expect( container.innerHTML ).toBe( expected );
	} );

	it( 'ignores non-string based children', () => {
		const html = '<p>So scary!</p>';
		const { container } = render(
			<RawHTML>
				{ html /* @ts-expect-error Test non-string children. */ }
				<p>Ignore this!</p>
			</RawHTML>
		);

		const expected = '<div><p>So scary!</p></div>';
		expect( container.innerHTML ).toBe( expected );
	} );
} );
