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

describe( 'useDisabled', () => {
	const Form = forwardRef( ( { showButton }, ref ) => {
		return (
			<form ref={ ref }>
				<input />
				<a href="https://wordpress.org/">A link</a>
				<p role="document" contentEditable tabIndex="0"></p>
				{ showButton && <button>Button</button> }
			</form>
		);
	} );

	function DisabledComponent( props ) {
		const disabledRef = useDisabled();
		return <Form ref={ disabledRef } { ...props } />;
	}

	it( 'will disable all fields', () => {
		render( <DisabledComponent /> );

		const input = screen.getByRole( 'textbox' );
		const link = screen.getByRole( 'link' );
		const p = screen.getByRole( 'document' );

		expect( input ).toHaveAttribute( 'inert', 'true' );
		expect( link ).toHaveAttribute( 'inert', 'true' );
		expect( p ).toHaveAttribute( 'inert', 'true' );
	} );

	it( 'will disable an element rendered in an update to the component', async () => {
		const { rerender } = render(
			<DisabledComponent showButton={ false } />
		);

		expect( screen.queryByText( 'Button' ) ).not.toBeInTheDocument();
		rerender( <DisabledComponent showButton /> );

		const button = screen.getByText( 'Button' );
		await waitFor( () => {
			expect( button ).toHaveAttribute( 'inert', 'true' );
		} );
	} );
} );
