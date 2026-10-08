import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { act, screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { speak } from '@wordpress/a11y';
import { useState } from '@wordpress/element';
import { SVG, Path } from '@wordpress/primitives';
import Snackbar from '../index';

vi.mock( import( '@wordpress/a11y' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	speak: vi.fn(),
} ) );
const mockedSpeak = vi.mocked( speak );

describe( 'Snackbar', () => {
	const testId = 'snackbar';

	beforeEach( () => {
		mockedSpeak.mockReset();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	it( 'should render correctly', async () => {
		await render( <Snackbar>Message</Snackbar> );

		const snackbar = screen.getByTestId( testId );

		expect( snackbar ).toBeVisible();
		expect( snackbar ).toHaveTextContent( 'Message' );
	} );

	it( 'should render with an additional className', async () => {
		await render( <Snackbar className="gutenberg">Message</Snackbar> );

		expect( screen.getByTestId( testId ) ).toHaveClass( 'gutenberg' );
	} );

	it( 'should render with an icon', async () => {
		const testIcon = (
			<SVG data-testid="icon">
				<Path />
			</SVG>
		);

		await render( <Snackbar icon={ testIcon }>Message</Snackbar> );

		const snackbar = screen.getByTestId( testId );
		const icon = within( snackbar ).getByTestId( 'icon' );

		expect( icon ).toBeVisible();
	} );

	it( 'should not restart auto-dismissal after an unrelated rerender', async () => {
		vi.useFakeTimers();
		const removeNotice = vi.fn();
		const { rerender } = await render(
			<Snackbar onRemove={ () => removeNotice() }>Message</Snackbar>
		);

		await act( async () => vi.advanceTimersByTime( 5000 ) );
		await rerender(
			<Snackbar onRemove={ () => removeNotice() }>Message</Snackbar>
		);
		await act( async () => vi.advanceTimersByTime( 1000 ) );

		expect( removeNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should be dismissible by clicking the snackbar', async () => {
		const onRemove = vi.fn();
		const onDismiss = vi.fn();

		await render(
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

		await userEvent.click( snackbar );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not be dismissible by clicking the snackbar when the `explicitDismiss` prop is set to `true`', async () => {
		vi.useFakeTimers();
		const onRemove = vi.fn();
		const onDismiss = vi.fn();

		await render(
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

		await userEvent.click( snackbar );

		expect( onRemove ).not.toHaveBeenCalled();
		expect( onDismiss ).not.toHaveBeenCalled();

		await act( async () => vi.advanceTimersByTime( 6000 ) );

		expect( onRemove ).not.toHaveBeenCalled();
		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'should be dismissible by clicking the close button when the `explicitDismiss` prop is set to `true`', async () => {
		const onRemove = vi.fn();
		const onDismiss = vi.fn();

		await render(
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

		await userEvent.click( closeButton );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'standalone focus restoration', () => {
		function DismissibleSnackbar(
			props: Omit<
				React.ComponentProps< typeof Snackbar >,
				'children' | 'onRemove'
			>
		) {
			const [ isVisible, setIsVisible ] = useState( true );
			return (
				isVisible && (
					<Snackbar
						{ ...props }
						onRemove={ () => setIsVisible( false ) }
					>
						Message
					</Snackbar>
				)
			);
		}

		it.each( [ '{Enter}', ' ' ] )(
			'returns focus to the preceding control after keyboard dismissal with %s',
			async ( key ) => {
				await render(
					<>
						<button>Previous control</button>
						<DismissibleSnackbar />
					</>
				);
				const previousControl = screen.getByRole( 'button', {
					name: 'Previous control',
				} );
				await userEvent.click( previousControl );
				await userEvent.tab();
				expect( screen.getByTestId( testId ) ).toHaveFocus();

				await userEvent.keyboard( key );

				expect(
					screen.queryByTestId( testId )
				).not.toBeInTheDocument();
				expect( previousControl ).toHaveFocus();
			}
		);

		it( 'returns focus outside the snackbar after explicit dismissal with an action', async () => {
			await render(
				<>
					<button>Previous control</button>
					<DismissibleSnackbar
						explicitDismiss
						actions={ [ { label: 'View post', onClick: vi.fn() } ] }
					/>
				</>
			);
			const previousControl = screen.getByRole( 'button', {
				name: 'Previous control',
			} );
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Dismiss this notice' } )
			);

			expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
			expect( previousControl ).toHaveFocus();
		} );

		it( 'dismisses safely when no preceding tabbable control exists', async () => {
			const onDismiss = vi.fn();
			await render( <DismissibleSnackbar onDismiss={ onDismiss } /> );
			await userEvent.tab();
			expect( screen.getByTestId( testId ) ).toHaveFocus();

			await userEvent.keyboard( '{Enter}' );

			expect( onDismiss ).toHaveBeenCalledTimes( 1 );
			expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
		} );

		it( 'preserves focus outside the snackbar when dismissing it', async () => {
			await render(
				<>
					<button>Previous control</button>
					<div
						role="presentation"
						onMouseDown={ ( event ) => event.preventDefault() }
					>
						<DismissibleSnackbar explicitDismiss />
					</div>
					<button>Current control</button>
				</>
			);
			const currentControl = screen.getByRole( 'button', {
				name: 'Current control',
			} );
			await userEvent.click( currentControl );

			// The consumer prevents pointer activation from moving focus.
			await userEvent.click(
				screen.getByRole( 'button', { name: 'Dismiss this notice' } )
			);

			expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
			expect( currentControl ).toHaveFocus();
		} );
	} );

	describe( 'actions', () => {
		it( 'should render only the first action with a warning when multiple actions are passed', async () => {
			await render(
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

		it( 'should be rendered as a link when the `url` prop is set', async () => {
			await render(
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
			const onClick = vi.fn();

			await render(
				<Snackbar actions={ [ { label: 'View post', onClick } ] }>
					Post updated.
				</Snackbar>
			);

			const snackbar = screen.getByTestId( testId );
			const button = within( snackbar ).getByRole( 'button', {
				name: 'View post',
			} );

			await userEvent.click( button );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should be rendered as a link when the `url` prop and the `onClick` are set', async () => {
			await render(
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
		it( 'should speak the given message', async () => {
			await render( <Snackbar>FYI</Snackbar> );

			expect( speak ).toHaveBeenCalledWith( 'FYI', 'polite' );
		} );

		it( 'should speak the given message by explicit politeness', async () => {
			await render( <Snackbar politeness="assertive">Uh oh!</Snackbar> );

			expect( speak ).toHaveBeenCalledWith( 'Uh oh!', 'assertive' );
		} );

		it( 'should coerce a message to a string', async () => {
			// This test assumes that `@wordpress/a11y` is capable of handling
			// markup strings appropriately.
			await render(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);

			expect( speak ).toHaveBeenCalledWith(
				'With <em>emphasis</em> this time.',
				'polite'
			);
		} );

		it( 'should not re-speak an effectively equivalent element message', async () => {
			const { rerender } = await render(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);
			await rerender(
				<Snackbar>
					With <em>emphasis</em> this time.
				</Snackbar>
			);

			expect( speak ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
