/**
 * External dependencies
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act, Simulate } from 'react-dom/test-utils';

/**
 * Internal dependencies
 */
import LinkControl from '../index';

let container = null;
beforeEach( () => {
	// setup a DOM element as a render target
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	// cleanup on exiting
	unmountComponentAtNode( container );
	container.remove();
	container = null;
} );

describe( 'Basic rendering', () => {
	it( 'should render icon button and in closed state by default', () => {
		act( () => {
			render(
				<LinkControl
				/>, container
			);
		} );
		const openIconButton = container.querySelector( '[aria-label="Insert link"]' );
		const openIcon = openIconButton.querySelector( 'svg' );
		const expectedIconClassName = expect.stringContaining( 'dashicons-insert' );

		expect( openIconButton ).not.toBeNull();
		expect( openIcon.getAttribute( 'class' ) ).toEqual( expectedIconClassName );

		expect( container.innerHTML ).toMatchSnapshot();
	} );

	it( 'should toggle link ui open on icon ui click', () => {
		act( () => {
			render(
				<LinkControl
				/>, container
			);
		} );
		const openIconButton = container.querySelector( '[aria-label="Insert link"]' );

		act( () => {
			Simulate.click( openIconButton );
		} );

		expect( openIconButton.nextSibling.innerHTML ).toEqual( expect.stringMatching( 'Link UI is open' ) );
	} );
} );
