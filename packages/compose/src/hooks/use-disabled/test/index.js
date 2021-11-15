/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useDisabled from '../';

jest.mock( '@wordpress/dom', () => {
	const focus = jest.requireActual( '../../../../../dom/src' ).focus;

	return {
		focus: {
			...focus,
			focusable: {
				...focus.focusable,
				find( context ) {
					// In JSDOM, all elements have zero'd widths and height.
					// This is a metric for focusable's `isVisible`, so find
					// and apply an arbitrary non-zero width.
					Array.from( context.querySelectorAll( '*' ) ).forEach(
						( element ) => {
							Object.defineProperties( element, {
								offsetWidth: {
									get: () => 1,
								},
							} );
						}
					);

					return focus.focusable.find( ...arguments );
				},
			},
		},
	};
} );

describe( 'useDisabled', () => {
	let MutationObserver;

	beforeAll( () => {
		MutationObserver = window.MutationObserver;
		window.MutationObserver = function () {};
		window.MutationObserver.prototype = {
			observe() {},
			disconnect() {},
		};
	} );

	afterAll( () => {
		window.MutationObserver = MutationObserver;
	} );

	const Form = forwardRef( ( _, ref ) => {
		return (
			<form ref={ ref }>
				<input />
				<a href="https://wordpress.org/">A link</a>
				<p contentEditable={ true } tabIndex="0"></p>
			</form>
		);
	} );

	function DisabledComponent() {
		const disabledRef = useDisabled();
		return <Form ref={ disabledRef } />;
	}

	it( 'will disable all fields', () => {
		const { container } = render( <DisabledComponent /> );

		const input = screen.getByRole( 'textbox' );
		const link = screen.getByRole( 'link' );
		const p = container.querySelector( 'p' );

		expect( input.hasAttribute( 'disabled' ) ).toBe( true );
		expect( link.getAttribute( 'tabindex' ) ).toBe( '-1' );
		expect( p.getAttribute( 'contenteditable' ) ).toBe( 'false' );
		expect( p.hasAttribute( 'tabindex' ) ).toBe( false );
		expect( p.hasAttribute( 'disabled' ) ).toBe( false );
	} );
} );
