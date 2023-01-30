/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import URLInputButton from '../button';

describe( 'URLInputButton', () => {
	it( 'should render a `Insert link` button and not be pressed when `url` is not provided', () => {
		render( <URLInputButton /> );

		expect(
			screen.queryByRole( 'button', {
				name: 'Edit link',
				pressed: true,
			} )
		).not.toBeInTheDocument();

		expect(
			screen.getByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		).toBeVisible();
	} );

	it( 'should render an `Edit link` button and be pressed when `url` is provided', () => {
		render( <URLInputButton url="https://example.com" /> );

		expect(
			screen.queryByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		).not.toBeInTheDocument();

		expect(
			screen.getByRole( 'button', {
				name: 'Edit link',
				pressed: true,
			} )
		).toBeVisible();
	} );

	it( 'should not render a form by default', () => {
		render( <URLInputButton /> );

		expect(
			screen.queryByRole( 'button', { name: 'Submit' } )
		).not.toBeInTheDocument();
	} );

	it( 'should render a form when `Insert link` button is clicked', async () => {
		const user = userEvent.setup();
		render( <URLInputButton /> );

		// Click the button to insert a link.
		await user.click(
			screen.getByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit' } )
		).toBeVisible();
	} );

	it( 'should call `onChange` function once per each value change', async () => {
		const user = userEvent.setup();
		const onChangeMock = jest.fn();

		render( <URLInputButton onChange={ onChangeMock } /> );

		// Click the button to insert a link.
		await user.click(
			screen.getByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		);

		// Type something into the URL field.
		const urlField = screen.getByRole( 'combobox' );
		const val1 = 'foo';
		const val2 = 'barbaz';
		await user.type( urlField, val1 );
		await user.type( urlField, val2 );

		expect( onChangeMock ).toHaveBeenCalledTimes(
			val1.length + val2.length
		);
	} );

	it( 'should close the form when the user clicks the `Close` button', async () => {
		const user = userEvent.setup();

		render( <URLInputButton /> );

		// Click the button to insert a link.
		await user.click(
			screen.getByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit' } )
		).toBeVisible();

		// Click the button to close the form.
		await user.click(
			screen.getByRole( 'button', {
				name: 'Close',
			} )
		);

		expect(
			screen.queryByRole( 'button', { name: 'Submit' } )
		).not.toBeInTheDocument();
	} );

	it( 'should close the form when user submits it', async () => {
		const user = userEvent.setup();

		function TestURLInputButton() {
			// maintain state for the controlled component and process value changes
			const [ url, setUrl ] = useState( '' );
			return <URLInputButton url={ url } onChange={ setUrl } />;
		}

		render( <TestURLInputButton /> );

		// Click the button to insert a link.
		await user.click(
			screen.getByRole( 'button', {
				name: 'Insert link',
				pressed: false,
			} )
		);

		// Type something into the URL field.
		await user.type( screen.getByRole( 'combobox' ), 'foo' );

		const submitButton = screen.getByRole( 'button', {
			name: 'Submit',
		} );

		expect( submitButton ).toBeInTheDocument();

		// Submit the form.
		await user.click( submitButton );

		expect( submitButton ).not.toBeInTheDocument();
	} );
} );
