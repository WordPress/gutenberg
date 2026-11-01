import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { speak } from '@wordpress/a11y';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import InlineNotices from '../index';
import { store as noticesStore } from '../../../store';
import type { NoticeOptions } from '../../../store/types';

vi.mock( import( '@wordpress/a11y' ), { spy: true } );

const MESSAGE = 'Updating failed.';
const DETAILS = 'The title was rejected.\nRemove it, then try again.';

async function renderWithNotice(
	status: 'success' | 'info' | 'error' | 'warning',
	options: NoticeOptions = {}
) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.dispatch( noticesStore ).createNotice( status, MESSAGE, options );

	await render(
		<RegistryProvider value={ registry }>
			<InlineNotices />
		</RegistryProvider>
	);

	return registry;
}

describe( 'InlineNotices', () => {
	beforeEach( () => {
		vi.mocked( speak ).mockClear();
	} );

	describe( 'details', () => {
		it( 'shows and hides the details from a disclosure', async () => {
			const user = userEvent.setup();
			await renderWithNotice( 'error', { details: DETAILS } );

			const trigger = screen.getByRole( 'button', {
				name: 'Show details',
			} );
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
			expect(
				screen.getByText( /The title was rejected/ )
			).not.toBeVisible();

			await user.click( trigger );

			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
			expect( trigger ).toHaveAccessibleName( 'Hide details' );
			expect( trigger ).toHaveFocus();
			await waitFor( () =>
				expect(
					screen.getByText( /The title was rejected/ )
				).toBeVisible()
			);

			await user.keyboard( '{Enter}' );

			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( trigger ).toHaveAccessibleName( 'Show details' );
		} );

		it.each( [
			[ 'without details', undefined ],
			[ 'with details that are only white space', ' \n ' ],
		] )( 'shows no disclosure or copy button %s', async ( _, details ) => {
			await renderWithNotice( 'error', { details } );

			expect(
				screen.queryByRole( 'button', { name: 'Show details' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Copy error' } )
			).not.toBeInTheDocument();
		} );

		it( 'copies the message and the details together', async () => {
			const user = userEvent.setup();
			const writeText = vi
				.spyOn( navigator.clipboard, 'writeText' )
				.mockResolvedValue();
			await renderWithNotice( 'error', { details: DETAILS } );

			const copyButton = screen.getByRole( 'button', {
				name: 'Copy error',
			} );
			const status = screen.getByRole( 'status' );
			expect( status ).toBeEmptyDOMElement();

			await user.click( copyButton );

			expect( writeText ).toHaveBeenCalledWith(
				`${ MESSAGE }\n\n${ DETAILS }`
			);
			await waitFor( () =>
				expect( status ).toHaveTextContent( 'Copied' )
			);
			// The button keeps its name, so the confirmation is the only
			// change announced.
			expect( copyButton ).toHaveAccessibleName( 'Copy error' );
			expect( copyButton ).toHaveFocus();
			expect( speak ).not.toHaveBeenCalledWith(
				expect.stringContaining( 'Copied' ),
				expect.anything()
			);
		} );

		it( 'does not confirm a copy that failed', async () => {
			const user = userEvent.setup();
			vi.spyOn( navigator.clipboard, 'writeText' ).mockRejectedValue(
				new Error( 'Not allowed' )
			);
			await renderWithNotice( 'error', { details: DETAILS } );

			await user.click(
				screen.getByRole( 'button', { name: 'Copy error' } )
			);

			expect( screen.getByRole( 'status' ) ).toBeEmptyDOMElement();
		} );

		it( 'links the web addresses in the details', async () => {
			const user = userEvent.setup();
			await renderWithNotice( 'error', {
				details:
					'Learn more about troubleshooting WordPress. (https://wordpress.org/documentation/article/faq-troubleshooting/)\nOr see https://example.com/help.',
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'Show details' } )
			);

			const links = screen.getAllByRole( 'link' );
			expect(
				links.map( ( link ) => link.getAttribute( 'href' ) )
			).toEqual( [
				// The closing parenthesis and the full stop end the
				// sentence, not the address.
				'https://wordpress.org/documentation/article/faq-troubleshooting/',
				'https://example.com/help',
			] );
			// A link must not take the user away from unsaved changes.
			expect( links[ 0 ] ).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'copies the details as they are, without changing their links', async () => {
			const user = userEvent.setup();
			const writeText = vi
				.spyOn( navigator.clipboard, 'writeText' )
				.mockResolvedValue();
			const details = 'See https://example.com/help.';
			await renderWithNotice( 'error', { details } );

			await user.click(
				screen.getByRole( 'button', { name: 'Copy error' } )
			);

			expect( writeText ).toHaveBeenCalledWith(
				`${ MESSAGE }\n\n${ details }`
			);
		} );

		it( 'labels the copy button by status', async () => {
			await renderWithNotice( 'warning', { details: DETAILS } );

			expect(
				screen.getByRole( 'button', { name: 'Copy message' } )
			).toBeInTheDocument();
		} );

		it( 'shows details but no copy button for an HTML message', async () => {
			await renderWithNotice( 'error', {
				details: DETAILS,
				__unstableHTML: true,
			} );

			expect(
				screen.getByRole( 'button', { name: 'Show details' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'Copy error' } )
			).not.toBeInTheDocument();
			// `__unstableHTML` is deprecated.
			expect( console ).toHaveWarned();
		} );
	} );

	describe( 'actions', () => {
		it( 'does not run a disabled action, even one with a URL', async () => {
			const user = userEvent.setup();
			const onClick = vi.fn();
			// `disabled` is not in the `NoticeAction` type, but notices have
			// long passed it on to the action button.
			const actions = [
				{ label: 'Button action', onClick, disabled: true },
				{ label: 'Link action', url: '#link', onClick, disabled: true },
			];
			await renderWithNotice( 'info', { actions } );

			for ( const name of [ 'Button action', 'Link action' ] ) {
				const action = screen.getByRole( 'button', { name } );
				expect( action ).toHaveAttribute( 'aria-disabled', 'true' );
				// Force the click, as Playwright does not click disabled elements.
				await user.click( action, { force: true } );
			}

			expect( onClick ).not.toHaveBeenCalled();
			expect(
				screen.queryByRole( 'link', { name: 'Link action' } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'announcements', () => {
		it( 'announces the message but not the details', async () => {
			await renderWithNotice( 'error', { details: DETAILS } );

			expect( speak ).toHaveBeenCalledTimes( 1 );
			expect( speak ).toHaveBeenCalledWith( MESSAGE, 'assertive' );
		} );

		it( 'announces notices that are not errors politely', async () => {
			await renderWithNotice( 'success' );

			expect( speak ).toHaveBeenCalledWith( MESSAGE, 'polite' );
		} );

		it( 'does not announce a notice created with `speak: false`', async () => {
			await renderWithNotice( 'error', { speak: false } );

			expect( speak ).not.toHaveBeenCalled();
		} );

		it( 'announces a notice that replaces one with the same ID', async () => {
			const registry = await renderWithNotice( 'error', {
				id: 'editor-save',
			} );
			vi.mocked( speak ).mockClear();

			registry
				.dispatch( noticesStore )
				.createNotice( 'error', 'Publishing failed.', {
					id: 'editor-save',
				} );
			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'Publishing failed.',
					'assertive'
				)
			);

			// The same message again is a new failure, so it is announced
			// again too.
			vi.mocked( speak ).mockClear();
			registry
				.dispatch( noticesStore )
				.createNotice( 'error', 'Publishing failed.', {
					id: 'editor-save',
				} );
			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'Publishing failed.',
					'assertive'
				)
			);
		} );
	} );
} );
