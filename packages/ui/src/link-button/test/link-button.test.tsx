import { createRef } from '@wordpress/element';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkButton } from '../index';

describe( 'LinkButton', () => {
	it( 'renders a link element by default', () => {
		render( <LinkButton href="/example">Go to example</LinkButton> );

		const link = screen.getByRole( 'link', { name: 'Go to example' } );

		expect( link ).toBeVisible();
		expect( link ).toHaveAttribute( 'href', '/example' );
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<LinkButton ref={ ref } href="/example">
				Go to example
			</LinkButton>
		);

		expect( ref.current ).toBeInstanceOf( HTMLAnchorElement );
	} );

	it( 'is not focusable when disabled', async () => {
		const user = userEvent.setup();
		const onClickMock = jest.fn(
			( event: React.MouseEvent< HTMLAnchorElement > ) =>
				event.preventDefault()
		);

		render(
			<LinkButton href="/example" disabled onClick={ onClickMock }>
				Go to example
			</LinkButton>
		);
		const link = screen.getByRole( 'link', { name: 'Go to example' } );

		expect( link ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( link ).toHaveAttribute( 'data-disabled', '' );
		expect( link ).toHaveAttribute( 'tabindex', '-1' );

		await user.keyboard( '{Tab}' );
		expect( link ).not.toHaveFocus();

		await user.click( link );
		expect( onClickMock ).not.toHaveBeenCalled();
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-link-button';
		render(
			<LinkButton href="/example" className={ customClass }>
				Go to example
			</LinkButton>
		);
		expect(
			screen.getByRole( 'link', { name: 'Go to example' } )
		).toHaveClass( customClass );
	} );
} );
