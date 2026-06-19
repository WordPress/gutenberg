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
import SandBox from '..';

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

	it( 'should resize the iframe in response to a resize message from the sandbox', () => {
		render( <SandBox html="<p>Hello</p>" title="Resize Test" /> );

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Resize Test' );

		// The iframe starts collapsed until the sandbox reports its size.
		expect( iframe ).toHaveAttribute( 'width', '0' );
		expect( iframe ).toHaveAttribute( 'height', '0' );

		// Simulate the sandbox responding to the parent's "ready" handshake
		// with its measured dimensions.
		fireEvent(
			window,
			new MessageEvent( 'message', {
				source: iframe.contentWindow,
				data: { action: 'resize', width: 320, height: 240 },
			} )
		);

		expect( iframe ).toHaveAttribute( 'width', '320' );
		expect( iframe ).toHaveAttribute( 'height', '240' );
	} );

	it( 'should ignore resize messages from other sources', () => {
		render( <SandBox html="<p>Hello</p>" title="Source Test" /> );

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Source Test' );

		// A message that doesn't originate from this iframe's content window
		// must not affect its size.
		fireEvent(
			window,
			new MessageEvent( 'message', {
				source: window,
				data: { action: 'resize', width: 320, height: 240 },
			} )
		);

		expect( iframe ).toHaveAttribute( 'width', '0' );
		expect( iframe ).toHaveAttribute( 'height', '0' );
	} );
} );
