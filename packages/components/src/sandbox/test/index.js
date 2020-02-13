/**
 * External dependencies
 */
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Sandbox from '../';

let container;

const TestWrapper = () => {
	const [ html, setHtml ] = useState(
		'<iframe class="mock-iframe" src="https://super.embed"></iframe>'
	);

	const updateHtml = () => {
		setHtml(
			'<iframe class="mock-iframe" src="https://another.super.embed"></iframe>'
		);
	};

	return (
		<div>
			<button onClick={ updateHtml } className="mock-button">
				Mock Button
			</button>
			<Sandbox html={ html } />
		</div>
	);
};

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	document.body.removeChild( container );
	container = null;
} );

it( 'should rerender with new emdeded content if html prop changes', () => {
	act( () => {
		ReactDOM.render( <TestWrapper />, container );
	} );

	const button = container.querySelector( '.mock-button' );
	const iframe = container.querySelector( '.components-sandbox' );

	let sandboxedIframe = iframe.contentWindow.document.body.querySelector(
		'.mock-iframe'
	);

	expect( sandboxedIframe.src ).toEqual( 'https://super.embed/' );

	act( () => {
		button.dispatchEvent(
			new window.MouseEvent( 'click', { bubbles: true } )
		);
	} );

	sandboxedIframe = iframe.contentWindow.document.body.querySelector(
		'.mock-iframe'
	);

	expect( sandboxedIframe.src ).toEqual( 'https://another.super.embed/' );
} );
