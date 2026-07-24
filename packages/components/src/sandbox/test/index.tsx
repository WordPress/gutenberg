/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SandBox, { VIEWPORT_UNIT_VALUE_REGEX, buildSandBoxDocument } from '..';

describe( 'SandBox', () => {
	const TestWrapper = () => {
		const [ html, setHtml ] = useState(
			'<iframe title="Mock Iframe" src="https://super.embed"></iframe>'
		);

		const updateHtml = () => {
			setHtml(
				'<iframe title="Mock Iframe" src="https://another.super.embed"></iframe>'
			);
		};

		return (
			<div>
				<button onClick={ updateHtml } className="mock-button">
					Mock Button
				</button>
				<SandBox html={ html } title="SandBox Title" />
			</div>
		);
	};

	it( 'should not include allow-same-origin by default', () => {
		render( <SandBox html="<p>Hello</p>" title="Test" /> );

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Test' );

		expect( iframe ).toHaveAttribute(
			'sandbox',
			'allow-scripts allow-presentation'
		);
		expect( iframe.getAttribute( 'sandbox' ) ).not.toContain(
			'allow-same-origin'
		);
	} );

	it( 'should set srcdoc with the provided html content', () => {
		render( <SandBox html="<p>Hello</p>" title="Test Title" /> );

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Test Title' );
		const srcDoc = iframe.getAttribute( 'srcdoc' ) ?? '';

		expect( srcDoc ).toContain( '<p>Hello</p>' );
		expect( srcDoc ).toContain( '<title>Test Title</title>' );
	} );

	it( 'should include custom styles in srcdoc', () => {
		render(
			<SandBox
				html="<p>Styled</p>"
				title="Styled Test"
				styles={ [ '.custom { color: red; }' ] }
			/>
		);

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Styled Test' );
		const srcDoc = iframe.getAttribute( 'srcdoc' ) ?? '';

		expect( srcDoc ).toContain( '.custom { color: red; }' );
	} );

	it( 'should include script tags in srcdoc', () => {
		render(
			<SandBox
				html="<p>Script</p>"
				title="Script Test"
				scripts={ [ 'https://example.com/embed.js' ] }
			/>
		);

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Script Test' );
		const srcDoc = iframe.getAttribute( 'srcdoc' ) ?? '';

		expect( srcDoc ).toContain(
			'<script src="https://example.com/embed.js">'
		);
	} );

	it( 'places the resize script in the head, before the user content', () => {
		// The resize script must parse before the (possibly malformed) user
		// content in the body. Otherwise an unclosed attribute quote in that
		// content swallows the <script> tag and its source leaks into the
		// preview as visible text.
		render( <SandBox html="<p>User content</p>" title="Head Script" /> );

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Head Script' );
		const srcDoc = iframe.getAttribute( 'srcdoc' ) ?? '';

		const resizeScriptIndex = srcDoc.indexOf( 'MutationObserver' );
		const bodyIndex = srcDoc.indexOf( '<body' );
		const userContentIndex = srcDoc.indexOf( '<p>User content</p>' );

		expect( resizeScriptIndex ).toBeGreaterThan( -1 );
		expect( resizeScriptIndex ).toBeLessThan( bodyIndex );
		expect( resizeScriptIndex ).toBeLessThan( userContentIndex );
	} );

	it( 'builds a document with the resize script in the head, before the body', () => {
		// Both sandboxes render this document: the isolated one as `srcdoc`,
		// the same-origin one via `contentDocument.write()`. Testing the shared
		// builder covers the write path too, so a future change cannot move the
		// resize helper back into the body on either path.
		const doc = buildSandBoxDocument( {
			html: '<p>User content</p>',
			title: 'Doc',
			styles: [],
			scripts: [],
			lang: 'en',
		} );

		const resizeScriptIndex = doc.indexOf( 'MutationObserver' );
		const bodyIndex = doc.indexOf( '<body' );
		const userContentIndex = doc.indexOf( '<p>User content</p>' );

		expect( resizeScriptIndex ).toBeGreaterThan( -1 );
		expect( resizeScriptIndex ).toBeLessThan( bodyIndex );
		expect( resizeScriptIndex ).toBeLessThan( userContentIndex );
	} );

	it( 'should update srcdoc when html prop changes', () => {
		render( <TestWrapper /> );

		const iframe =
			screen.getByTitle< HTMLIFrameElement >( 'SandBox Title' );

		expect( iframe ).toHaveAttribute(
			'srcdoc',
			expect.stringContaining( 'https://super.embed' )
		);

		fireEvent.click( screen.getByRole( 'button' ) );

		expect( iframe ).toHaveAttribute(
			'srcdoc',
			expect.stringContaining( 'https://another.super.embed' )
		);
	} );

	describe( 'VIEWPORT_UNIT_VALUE_REGEX', () => {
		it.each( [
			'100vh',
			'50vw',
			'0vh',
			'50.5vh',
			'.5vh',
			'100dvh',
			'50svw',
			'1lvi',
			'100vmin',
			'100vmax',
		] )( 'matches viewport unit value %s', ( value ) => {
			expect( VIEWPORT_UNIT_VALUE_REGEX.test( value ) ).toBe( true );
		} );

		it.each( [
			'100px',
			'50%',
			'100',
			'vh',
			'.vh',
			'calc(100vh - 10px)',
			'100 vh',
			'',
		] )( 'does not match %s', ( value ) => {
			expect( VIEWPORT_UNIT_VALUE_REGEX.test( value ) ).toBe( false );
		} );

		it( 'is embedded in the sandbox iframe srcdoc', () => {
			// Guards against drift between the exported constant and
			// the copy inlined into `observeAndResizeJS`, which is
			// serialized via `.toString()` into the iframe srcdoc and
			// cannot reference module-scope values at runtime.
			render( <SandBox html="<p>x</p>" title="Regex Sync Test" /> );
			const iframe =
				screen.getByTitle< HTMLIFrameElement >( 'Regex Sync Test' );
			const srcDoc = iframe.getAttribute( 'srcdoc' ) ?? '';

			expect( srcDoc ).toContain( VIEWPORT_UNIT_VALUE_REGEX.source );
		} );
	} );
} );
