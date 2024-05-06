/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import { click } from '@ariakit/test';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Snackbar from '../index';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );
const mockedSpeak = jest.mocked( speak );

describe( 'Snackbar', () => {
	const testId = 'snackbar';

	beforeEach( () => {
		mockedSpeak.mockReset();
	} );

	it( 'should render correctly', () => {
		render( <Snackbar>Message</Snackbar> );

		const snackbar = screen.getByTestId( testId );

		expect( snackbar ).toBeVisible();
		expect( snackbar ).toHaveTextContent( 'Message' );
	} );

	it( 'should render with an additional className', () => {
		render( <Snackbar className="gutenberg">Message</Snackbar> );

		expect( screen.getByTestId( testId ) ).toHaveClass( 'gutenberg' );
	} );

	it( 'should render with an icon', () => {
		const testIcon = (
			<SVG data-testid="icon">
				<Path />
			</SVG>
		);

		render( <Snackbar icon={ testIcon }>Message</Snackbar> );

		const snackbar = screen.getByTestId( testId );
		const icon = within( snackbar ).getByTestId( 'icon' );

		expect( icon ).toBeVisible();
	} );

	it( 'should be dismissible by clicking the snackbar', async () => {
		const onRemove = jest.fn();
		const onDismiss = jest.fn();

		render(
			<Snackbar onRemove={ onRemove } onDismiss={ onDismiss }>
				Message
			</Snackbar>
		);

		const snackbar = screen.getByTestId( testId );

		expect( snackbar ).toHaveAttribute( 'role', 'button' );
		expect( snackbar ).toHaveAttribute(
			'aria-label',
			'Dismiss this notice'
		);

		await click( snackbar );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not be dismissible by clicking the snackbar when the `explicitDismiss` prop is set to `true`', async () => {
		const onRemove = jest.fn();
		const onDismiss = jest.fn();

		render(
			<Snackbar
				explicitDismiss
				onRemove={ onRemove }
				onDismiss={ onDismiss }
			>
				Message
			</Snackbar>
		);

		const snackbar = screen.getByTestId( testId );

		expect( snackbar ).not.toHaveAttribute( 'role', 'button' );
		expect( snackbar ).not.toHaveAttribute(
			'aria-label',
			'Dismiss this notice'
		);
		expect( snackbar ).toHaveClass(
			'components-snackbar-explicit-dismiss'
		);

		await click( snackbar );

		expect( onRemove ).not.toHaveBeenCalled();
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'should be dismissible by clicking the close button when the `explicitDismiss` prop is set to `true`', async () => {
		const onRemove = jest.fn();
		const onDismiss = jest.fn();

		render(
			<Snackbar
				explicitDismiss
				onRemove={ onRemove }
				onDismiss={ onDismiss }
			>
				Message
			</Snackbar>
		);

		const snackbar = screen.getByTestId( testId );
		const closeButton = within( snackbar ).getByRole( 'button', {
			name: 'Dismiss this notice',
		} );

		await click( closeButton );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'actions', () => {
		it( 'should render only the first action with a warning when multiple actions are passed', () => {
			render(
				<Snackbar
					actions={ [
						{ label: 'One', url: 'https://example.com' },
						{ label: 'Two', url: 'https://example.com' },
						{ label: 'Three', url: 'https://example.com' },
					] }
				>
					Message
				</Snackbar>
			);

			expect( console ).toHaveWarnedWith(
				'Snackbar can only have one action. Use Notice if your message requires many actions.'
			);

			const snackbar = screen.getByTestId( testId );
			const action = within( snackbar ).getByRole( 'link' );

			expect( action ).toBeVisible();
			expect( action ).toHaveTextContent( 'One' );
		} );

		it( 'should be rendered as a link when the `url` prop is set', () => {
			render(
				<Snackbar
					actions={ [
						{ label: 'View post', url: 'https://example.com' },
					] }
				>
					Post updated.
				</Snackbar>
			);

			const snackbar = screen.getByTestId( testId );
			const link = within( snackbar ).getByRole( 'link', {
				name: 'View post',
			} );

			expect( link ).toHaveAttribute( 'href', 'https://example.com' );
		} );

		it( 'should be rendered as a button and call `onClick` when the `onClick` prop is set', async () => {
			const onClick = jest.fn();

			render(
				<Snackbar actions={ [ { label: 'View post', onClick } ] }>
					Post updated.
				</Snackbar>
			);

			const snackbar = screen.getByTestId( testId );
			const button = within( snackbar ).getByRole( 'button', {
				name: 'View post',
			} );

			await click( button );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should be rendered as a link when the `url` prop and the `onClick` are set', () => {
			render(
				<Snackbar
					actions={ [
						{
							label: 'View post',
							url: 'https://example.com',
							onClick: () => {},
						},
					] }
				>
					Post updated.
				</Snackbar>
			);

			const snackbar = screen.getByTestId( testId );
			const link = within( snackbar ).getByRole( 'link', {
				name: 'View post',
			} );
			expect( link ).toBeVisible();
		} );
	} );

	describe( 'useSpokenMessage', () => {
		it( 'should speak the given message', () => {
			render( <Snackbar>FYI</Snackbar> );

			expect( speak ).toHaveBeenCalledWith( 'FYI', 'polite' );
		} );

		it( 'should speak the given message by explicit politeness', () => {
			render( <Snackbar politeness="assertive">Uh oh!</Snackbar> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should coerce a message to a string', () => {
			// This test assumes that `@wordpress/a11y` is capable of handling
			// markup strings appropriately.
			render(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);

			expect( speak ).toHaveBeenCalledWith(
				'With <em>emphasis</em> this time.',
				'polite'
			);
		} );

		it( 'should not re-speak an effectively equivalent element message', () => {
			const { rerender } = render(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);
			rerender(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);

			expect( speak ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
