/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import Warning from '../index';

describe( 'Warning', () => {
	it( 'should match snapshot', () => {
		const { container } = render( <Warning>error</Warning> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should show primary actions', () => {
		render(
			<Warning actions={ <button>Click me</button> }>Message</Warning>
		);

		expect(
			screen.getByRole( 'button', { name: 'Click me' } )
		).toBeVisible();

		expect(
			screen.queryByRole( 'button', { name: 'More options' } )
		).not.toBeInTheDocument();
	} );

	it( 'should show hidden secondary actions', async () => {
		const user = userEvent.setup();

		render(
			<Warning secondaryActions={ [ { title: 'test', onClick: null } ] }>
				Message
			</Warning>
		);

		const secondaryActionsBtn = screen.getByRole( 'button', {
			name: 'More options',
		} );

		expect( secondaryActionsBtn ).toBeVisible();
		expect(
			screen.queryByRole( 'menuitem', { name: 'test' } )
		).not.toBeInTheDocument();

		await user.click( secondaryActionsBtn );

		expect(
			screen.getByRole( 'menuitem', { name: 'test' } )
		).toBeInTheDocument();
	} );
} );
