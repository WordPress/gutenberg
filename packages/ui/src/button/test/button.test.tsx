import { createRef } from '@wordpress/element';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../index';

describe( 'Button', () => {
	it( 'renders a button element by default', () => {
		render( <Button>Click me</Button> );

		expect(
			screen.getByRole( 'button', { name: 'Click me' } )
		).toBeVisible();
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <Button ref={ ref }>Click me</Button> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'is accessible when disabled by default', async () => {
		const user = userEvent.setup();

		const onClickMock = jest.fn();
		render(
			// Disabling because this lint rule was meant for the
			// `@wordpress/components` Button, but is being applied here.
			// TODO: rework the lint rule so that it checks the package
			// where the Button comes from.
			// eslint-disable-next-line no-restricted-syntax
			<Button disabled onClick={ onClickMock }>
				Click me
			</Button>
		);
		const button = screen.getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.keyboard( '{Tab}' );
		expect( button ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( onClickMock ).not.toHaveBeenCalled();
	} );

	it( 'is disabled when loading', () => {
		render( <Button loading>Click me</Button> );

		const button = screen.getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'can be enabled explicitly when loading', () => {
		render(
			// Disabling because this lint rule was meant for the
			// `@wordpress/components` Button, but is being applied here.
			// TODO: rework the lint rule so that it checks the package
			// where the Button comes from.
			// TODO: Additional improvement in the original lint rule: only error if disabled=true?
			// eslint-disable-next-line no-restricted-syntax
			<Button loading disabled={ false }>
				Click me
			</Button>
		);

		const button = screen.getByRole( 'button', { name: 'Click me' } );

		expect( button ).toBeEnabled();
		expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'supports custom render prop while retaining the default focusable when disabled behavior', () => {
		render(
			// Disabling because this lint rule was meant for the
			// `@wordpress/components` Button, but is being applied here.
			// TODO: rework the lint rule so that it checks the package
			// where the Button comes from.
			// eslint-disable-next-line jsx-a11y/anchor-has-content, no-restricted-syntax
			<Button render={ <a href="/" /> } nativeButton={ false } disabled>
				Click me
			</Button>
		);
		const button = screen.getByRole( 'button', { name: 'Click me' } );

		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-button';
		render(
			<Button render={ <button /> } className={ customClass }>
				Click me
			</Button>
		);
		expect(
			screen.getByRole( 'button', { name: 'Click me' } )
		).toHaveClass( customClass );
	} );
} );
