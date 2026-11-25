import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { safeHTML } from '@wordpress/dom';
import SafeRawHTML, { setSafeHTML } from '../';

describe( 'setSafeHTML', () => {
	it( 'fills the element with the sanitized nodes', () => {
		const element = document.createElement( 'div' );
		setSafeHTML(
			element,
			'<p>Text</p><script>alert(1)</script><img src="x" onerror="alert(1)">'
		);

		expect( element.innerHTML ).toBe( '<p>Text</p><img src="x">' );
	} );

	it( 'inserts the markup that safeHTML returns', () => {
		const html =
			'<iframe srcdoc="Text"></iframe><a href="javascript:alert(1)">Link</a>';
		const element = document.createElement( 'div' );
		setSafeHTML( element, html );

		expect( element.innerHTML ).toBe( safeHTML( html ) );
	} );

	it( 'replaces the existing children', () => {
		const element = document.createElement( 'div' );
		element.innerHTML = '<p>Old</p>';
		setSafeHTML( element, '<p>New</p>' );

		expect( element.innerHTML ).toBe( '<p>New</p>' );
	} );

	it( "moves the nodes into the element's document", () => {
		const element = document.createElement( 'div' );
		setSafeHTML( element, '<p>Text</p>' );

		expect( element.firstChild?.ownerDocument ).toBe( document );
	} );
} );

describe( 'SafeRawHTML', () => {
	it( 'renders the sanitized HTML in a div', () => {
		const { container } = render(
			<SafeRawHTML html='<p onclick="alert(1)">Text</p>' />
		);

		expect( container.innerHTML ).toBe( '<div><p>Text</p></div>' );
	} );

	it( 'updates the content when the HTML changes', () => {
		const { container, rerender } = render(
			<SafeRawHTML html="<p>Old</p>" />
		);
		rerender( <SafeRawHTML html="<p>New</p><script>alert(1)</script>" /> );

		expect( container.innerHTML ).toBe( '<div><p>New</p></div>' );
	} );
} );
