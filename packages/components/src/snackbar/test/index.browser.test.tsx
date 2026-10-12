import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { act, screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { speak } from '@wordpress/a11y';
import { createPortal, useState } from '@wordpress/element';
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

	it.each( [ false, true ] )(
		'restores standalone focus on keyboard dismissal with explicitDismiss=%s',
		async ( explicitDismiss ) => {
			function DismissibleSnackbar() {
				const [ isVisible, setIsVisible ] = useState( true );
				return (
					<>
						<button>Previous control</button>
						{ isVisible && (
							<Snackbar
								explicitDismiss={ explicitDismiss }
								actions={ [ { label: 'View post', url: '#' } ] }
								onRemove={ () => setIsVisible( false ) }
							>
								Message
							</Snackbar>
						) }
					</>
				);
			}
			await render( <DismissibleSnackbar /> );
			screen.getByRole( 'button', { name: 'Previous control' } ).focus();
			screen
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.focus();

			await userEvent.keyboard( '{Enter}' );

			expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Previous control' } )
			).toHaveFocus();
		}
	);

	it.each( [ 'keyboard', 'pointer' ] )(
		'returns focus to the last outside control when dismissing a portaled snackbar with %s',
		async ( input ) => {
			function PortaledSnackbar() {
				const [ isVisible, setIsVisible ] = useState( true );
				return (
					<>
						<button>Previous control</button>
						<button>Unrelated footer control</button>
						{ isVisible &&
							createPortal(
								<Snackbar
									explicitDismiss
									actions={ [
										{ label: 'View post', url: '#' },
									] }
									onRemove={ () => setIsVisible( false ) }
								>
									Message
								</Snackbar>,
								document.body
							) }
					</>
				);
			}
			await render( <PortaledSnackbar /> );
			const previousControl = screen.getByRole( 'button', {
				name: 'Previous control',
			} );
			previousControl.focus();

			if ( input === 'keyboard' ) {
				screen.getByTestId( testId ).focus();
				await userEvent.keyboard( '{Tab}{Tab}{Enter}' );
			} else {
				await userEvent.click(
					screen.getByRole( 'button', {
						name: 'Dismiss this notice',
					} )
				);
			}

			expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
			expect( previousControl ).toHaveFocus();
		}
	);

	it( 'updates the focus return target when focus enters the snackbar again', async () => {
		await render(
			<>
				<button>First control</button>
				<Snackbar
					explicitDismiss
					actions={ [ { label: 'View post', url: '#' } ] }
				>
					Message
				</Snackbar>
				<button>Second control</button>
			</>
		);
		const dismissControl = screen.getByRole( 'button', {
			name: 'Dismiss this notice',
		} );
		screen.getByRole( 'button', { name: 'First control' } ).focus();
		dismissControl.focus();
		const secondControl = screen.getByRole( 'button', {
			name: 'Second control',
		} );
		secondControl.focus();
		screen.getByRole( 'link', { name: 'View post' } ).focus();
		await userEvent.keyboard( '{Tab}{Enter}' );

		expect( secondControl ).toHaveFocus();
	} );

	it( 'leaves outside focus unchanged when dismissal does not focus the snackbar', async () => {
		const onRemove = vi.fn();
		await render(
			<>
				<button>Previous control</button>
				<Snackbar onRemove={ onRemove }>Message</Snackbar>
				<button>Current control</button>
			</>
		);
		const currentControl = screen.getByRole( 'button', {
			name: 'Current control',
		} );
		currentControl.focus();
		// Cancel the pointer's focus change while allowing its click to dismiss.
		const snackbar = screen.getByTestId( testId );
		snackbar.addEventListener(
			'mousedown',
			( event ) => event.preventDefault(),
			{ once: true }
		);
		await userEvent.click( snackbar );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
		expect( currentControl ).toHaveFocus();
	} );

	it( 'dismisses safely when the previous control has been removed', async () => {
		function DismissibleSnackbar( {
			showPreviousControl,
		}: {
			showPreviousControl: boolean;
		} ) {
			const [ isVisible, setIsVisible ] = useState( true );
			return (
				<>
					{ showPreviousControl && <button>Previous control</button> }
					<button>Unrelated control</button>
					{ isVisible && (
						<Snackbar
							explicitDismiss
							onRemove={ () => setIsVisible( false ) }
						>
							Message
						</Snackbar>
					) }
				</>
			);
		}
		const { rerender } = await render(
			<DismissibleSnackbar showPreviousControl />
		);
		screen.getByRole( 'button', { name: 'Previous control' } ).focus();
		screen.getByRole( 'button', { name: 'Dismiss this notice' } ).focus();
		await rerender( <DismissibleSnackbar showPreviousControl={ false } /> );
		await userEvent.keyboard( '{Enter}' );

		expect( screen.queryByTestId( testId ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Unrelated control' } )
		).not.toHaveFocus();
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
