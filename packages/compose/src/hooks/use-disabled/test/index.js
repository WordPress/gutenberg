/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

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
									configurable: true,
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

jest.useRealTimers();

describe( 'useDisabled', () => {
	const Form = forwardRef( ( { showButton }, ref ) => {
		return (
			<form ref={ ref }>
				<input />
				<a href="https://wordpress.org/">A link</a>
				<p contentEditable={ true } tabIndex="0"></p>
				{ showButton && <button>Button</button> }
			</form>
		);
	} );

	function DisabledComponent( props ) {
		const disabledRef = useDisabled();
		return <Form ref={ disabledRef } { ...props } />;
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

	it( 'will disable an element rendered in an update to the component', async () => {
		const { rerender } = render(
			<DisabledComponent showButton={ false } />
		);

		expect( screen.queryByText( 'Button' ) ).not.toBeInTheDocument();
		rerender( <DisabledComponent showButton={ true } /> );

		const button = screen.getByText( 'Button' );
		await waitFor( () => {
			expect( button.hasAttribute( 'disabled' ) ).toBe( true );
		} );
	} );
} );
