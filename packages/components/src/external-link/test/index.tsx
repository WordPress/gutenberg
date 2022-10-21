/**
 * External dependencies
 */
import { render, screen, fireEvent, createEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ExternalLink } from '..';

describe( 'ExternalLink', () => {
	test( 'should call function passed in onClick handler when clicking the link', () => {
		const doSomething = jest.fn();

		render(
			<ExternalLink
				href="https://wordpress.org"
				onClick={ doSomething }
				data-testid="external-link"
			>
				WordPress.org
			</ExternalLink>
		);

		fireEvent.click( screen.getByTestId( 'external-link' ) );

		expect( doSomething ).toHaveBeenCalled();
	} );

	test( 'should prevent default action when clicking an internal anchor link', () => {
		render(
			<ExternalLink href="#test" data-testid="external-link">
				I&apos;m an anchor link!
			</ExternalLink>
		);

		const component = screen.getByTestId( 'external-link' );
		const clickEvent = createEvent.click( component );

		fireEvent( component, clickEvent );

		expect( clickEvent.defaultPrevented ).toBe( true );
	} );

	test( 'should call function passed in onClick handler and prevent default action when clicking an internal anchor link', () => {
		const doSomething = jest.fn();

		render(
			<ExternalLink
				href="#test"
				onClick={ doSomething }
				data-testid="external-link"
			>
				I&apos;m an anchor link!
			</ExternalLink>
		);

		const component = screen.getByTestId( 'external-link' );
		const clickEvent = createEvent.click( component );

		fireEvent( component, clickEvent );

		expect( doSomething ).toHaveBeenCalled();
		expect( clickEvent.defaultPrevented ).toBe( true );
	} );

	test( 'should not prevent default action when clicking a non anchor link', () => {
		render(
			<ExternalLink
				href="https://wordpress.org"
				data-testid="external-link"
			>
				I&apos;m not an anchor link!
			</ExternalLink>
		);

		const component = screen.getByTestId( 'external-link' );
		const clickEvent = createEvent.click( component );

		fireEvent( component, clickEvent );

		expect( clickEvent.defaultPrevented ).toBe( false );
	} );
} );
