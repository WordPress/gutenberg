/**
 * External dependencies
 */
import { createRef } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { Button } from '../index';

describe( 'Button', () => {
	it( 'renders a button element by default', () => {
		const { getByRole } = render( <Button>Click me</Button> );

		expect(
			getByRole( 'button', { name: 'Click me' } )
		).toBeInTheDocument();
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <Button ref={ ref }>Click me</Button> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'is accessible when disabled by default', async () => {
		const user = userEvent.setup();

		const onClickMock = jest.fn();
		const { getByRole } = render(
			<Button disabled onClick={ onClickMock }>
				Click me
			</Button>
		);
		const button = getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.keyboard( '{Tab}' );
		expect( button ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( onClickMock ).not.toHaveBeenCalled();
	} );

	it( 'is disabled when loading', () => {
		const { getByRole } = render(
			<Button loading loadingAnnouncement="Loading">
				Click me
			</Button>
		);

		const button = getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'can be enabled explicitly when loading', () => {
		const { getByRole } = render(
			<Button loading loadingAnnouncement="Loading" disabled={ false }>
				Click me
			</Button>
		);

		const button = getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'supports custom render prop while retaining the default accessible when disabled behavior', () => {
		const { getByRole } = render(
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			<Button render={ <a href="/" /> } disabled>
				Click me
			</Button>
		);
		const button = getByRole( 'link', { name: 'Click me' } );

		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-button';
		const { getByRole } = render(
			<Button render={ <button /> } className={ customClass }>
				Click me
			</Button>
		);
		const button = getByRole( 'button', { name: 'Click me' } );

		// Should have both built-in classes and custom class
		expect( button ).toHaveClass( 'button' );
		expect( button ).toHaveClass( customClass );
	} );
} );
