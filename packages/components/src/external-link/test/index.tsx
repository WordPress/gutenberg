/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { ExternalLink } from '..';

describe( 'ExternalLink', () => {
	test( 'should set external rel token', () => {
		render(
			<ExternalLink href="https://wordpress.org">
				WordPress.org
			</ExternalLink>
		);

		expect(
			screen.getByRole( 'link', {
				name: 'WordPress.org (opens in a new tab)',
			} )
		).toHaveAttribute( 'rel', 'external' );
	} );

	test( 'should preserve custom rel tokens', () => {
		render(
			<ExternalLink href="https://wordpress.org" rel="nofollow">
				WordPress.org
			</ExternalLink>
		);

		expect(
			screen.getByRole( 'link', {
				name: 'WordPress.org (opens in a new tab)',
			} )
		).toHaveAttribute( 'rel', 'nofollow external' );
	} );

	test( 'should not add noreferrer or noopener rel tokens', () => {
		render(
			<ExternalLink href="https://wordpress.org">
				WordPress.org
			</ExternalLink>
		);

		const link = screen.getByRole( 'link', {
			name: 'WordPress.org (opens in a new tab)',
		} );

		expect( link ).not.toHaveAttribute(
			'rel',
			expect.stringContaining( 'noreferrer' )
		);
		expect( link ).not.toHaveAttribute(
			'rel',
			expect.stringContaining( 'noopener' )
		);
	} );

	test( 'should call function passed in onClick handler when clicking the link', async () => {
		const user = await userEvent.setup();
		const onClickMock = jest.fn();

		render(
			<ExternalLink href="https://wordpress.org" onClick={ onClickMock }>
				WordPress.org
			</ExternalLink>
		);

		const link = screen.getByRole( 'link', {
			name: 'WordPress.org (opens in a new tab)',
		} );

		await user.click( link );

		expect( onClickMock ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'should prevent default action when clicking an internal anchor link without passing onClick prop', async () => {
		const user = await userEvent.setup();

		render(
			<ExternalLink href="#test">I&apos;m an anchor link!</ExternalLink>
		);

		const link = screen.getByRole( 'link', {
			name: "I'm an anchor link! (opens in a new tab)",
		} );

		// We are using this approach so we can test the defaultPrevented
		// without passing an onClick prop to the component.
		const onClickMock = jest.fn();
		link.onclick = onClickMock;

		await user.click( link );
		expect( onClickMock ).toHaveBeenCalledTimes( 1 );
		expect( onClickMock ).toHaveBeenLastCalledWith(
			expect.objectContaining( { defaultPrevented: true } )
		);
	} );

	test( 'should call function passed in onClick handler and prevent default action when clicking an internal anchor link', async () => {
		const user = await userEvent.setup();
		const onClickMock = jest.fn();

		render(
			<ExternalLink href="#test" onClick={ onClickMock }>
				I&apos;m an anchor link!
			</ExternalLink>
		);

		const link = screen.getByRole( 'link', {
			name: "I'm an anchor link! (opens in a new tab)",
		} );

		await user.click( link );
		expect( onClickMock ).toHaveBeenCalledTimes( 1 );
		expect( onClickMock ).toHaveBeenLastCalledWith(
			expect.objectContaining( { defaultPrevented: true } )
		);
	} );

	test( 'should not prevent default action when clicking a non anchor link without passing onClick prop', async () => {
		const user = await userEvent.setup();

		render(
			<ExternalLink href="https://wordpress.org">
				I&apos;m not an anchor link!
			</ExternalLink>
		);

		const link = screen.getByRole( 'link', {
			name: "I'm not an anchor link! (opens in a new tab)",
		} );

		// We are using this approach so we can test the defaultPrevented
		// without passing an onClick prop to the component.
		const onClickMock = jest.fn();
		link.onclick = onClickMock;

		await user.click( link );

		expect( onClickMock ).toHaveBeenCalledTimes( 1 );
		expect( onClickMock ).toHaveBeenLastCalledWith(
			expect.objectContaining( { defaultPrevented: false } )
		);
	} );
} );
