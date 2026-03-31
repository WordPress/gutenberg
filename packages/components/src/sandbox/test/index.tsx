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
			// MutationObserver implementation from JSDom does not work as intended
			// with iframes so we need to ignore it for the time being.
			'<script type="text/javascript">window.MutationObserver = null;</script>' +
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

	it( 'should rerender with new emdeded content if html prop changes', () => {
		render( <TestWrapper /> );

		const iframe =
			screen.getByTitle< HTMLIFrameElement >( 'SandBox Title' );

		// JSDOM does not reliably populate `iframe.contentWindow.document` when
		// using `srcDoc`, so assert against the `srcdoc` attribute instead.
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
} );
