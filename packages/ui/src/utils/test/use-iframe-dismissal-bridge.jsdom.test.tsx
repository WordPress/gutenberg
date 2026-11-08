import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IframeDismissalHarness } from './fixtures/iframe-dismissal-harness';

describe( 'useIframeDismissalBridge', () => {
	it( 'does not close for presses inside a popup portaled to an iframe', async () => {
		const user = userEvent.setup();
		const iframe = document.createElement( 'iframe' );
		document.body.appendChild( iframe );
		const iframeDocument = iframe.contentDocument;

		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const addEventListener = vi.spyOn( iframeDocument, 'addEventListener' );

		try {
			const outsideTarget = iframeDocument.createElement( 'button' );
			iframeDocument.body.appendChild( outsideTarget );

			render(
				<IframeDismissalHarness
					popupContainer={ iframeDocument.body }
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Actions' } )
			);
			const portaledPopup = await within(
				iframeDocument.body
			).findByRole( 'dialog' );
			const item = within( portaledPopup ).getByRole( 'button', {
				name: 'Inside popup',
			} );
			await waitFor( () => {
				expect( addEventListener ).toHaveBeenCalledWith(
					'pointerdown',
					expect.any( Function ),
					true
				);
			} );

			act( () => {
				item.dispatchEvent(
					new MouseEvent( 'pointerdown', { bubbles: true } )
				);
			} );
			expect( portaledPopup ).toBeVisible();

			act( () => {
				outsideTarget.dispatchEvent(
					new MouseEvent( 'pointerdown', { bubbles: true } )
				);
			} );
			await waitFor( () => {
				expect( portaledPopup ).not.toBeVisible();
			} );
		} finally {
			iframe.remove();
		}
	} );

	it( 'reattaches the iframe listener after reload and removes it when closed', async () => {
		const user = userEvent.setup();

		const { unmount } = render( <IframeDismissalHarness /> );

		const iframe = screen.getByTitle( 'Editor canvas' );
		const firstDocument = document.implementation.createHTMLDocument();
		const reloadedDocument = document.implementation.createHTMLDocument();
		let iframeDocument = firstDocument;
		Object.defineProperty( iframe, 'contentDocument', {
			configurable: true,
			get: () => iframeDocument,
		} );
		const firstAddEventListener = vi.spyOn(
			firstDocument,
			'addEventListener'
		);
		const firstRemoveEventListener = vi.spyOn(
			firstDocument,
			'removeEventListener'
		);
		const reloadedAddEventListener = vi.spyOn(
			reloadedDocument,
			'addEventListener'
		);
		const reloadedRemoveEventListener = vi.spyOn(
			reloadedDocument,
			'removeEventListener'
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'dialog' ) ).toBeVisible();
		await waitFor( () => {
			expect( firstAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		iframeDocument = reloadedDocument;
		act( () => iframe.dispatchEvent( new Event( 'load' ) ) );

		expect( firstRemoveEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);
		expect( reloadedAddEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
		expect( reloadedRemoveEventListener ).toHaveBeenCalledWith(
			'pointerdown',
			expect.any( Function ),
			true
		);
		reloadedAddEventListener.mockClear();
		reloadedRemoveEventListener.mockClear();

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'dialog' ) ).toBeVisible();
		await waitFor( () => {
			expect( reloadedAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );
		const reloadedPointerDownListener =
			reloadedAddEventListener.mock.calls.find(
				( [ type, , capture ] ) =>
					type === 'pointerdown' && capture === true
			)?.[ 1 ];
		unmount();
		expect( reloadedRemoveEventListener ).toHaveBeenCalledExactlyOnceWith(
			'pointerdown',
			reloadedPointerDownListener,
			true
		);
	} );

	it( 'moves the listener when an iframe remounts while the popup is open', async () => {
		const user = userEvent.setup();

		const { rerender } = render(
			<IframeDismissalHarness iframeKey="first" />
		);
		const firstIframe = screen.getByTitle( 'Editor canvas' );
		const firstDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( firstIframe, 'contentDocument', {
			configurable: true,
			get: () => firstDocument,
		} );
		const firstAddEventListener = vi.spyOn(
			firstDocument,
			'addEventListener'
		);
		const firstRemoveEventListener = vi.spyOn(
			firstDocument,
			'removeEventListener'
		);

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		expect( await screen.findByRole( 'dialog' ) ).toBeVisible();
		await waitFor( () => {
			expect( firstAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		const firstPointerDownListener = firstAddEventListener.mock.calls.find(
			( [ type, , capture ] ) =>
				type === 'pointerdown' && capture === true
		)?.[ 1 ];
		rerender( <IframeDismissalHarness iframeKey="second" /> );
		await waitFor( () => {
			expect( firstRemoveEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				firstPointerDownListener,
				true
			);
		} );

		act( () => {
			firstDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );
		expect( screen.getByRole( 'dialog' ) ).toBeVisible();

		const secondIframe = screen.getByTitle( 'Editor canvas' );
		const secondDocument = document.implementation.createHTMLDocument();
		Object.defineProperty( secondIframe, 'contentDocument', {
			configurable: true,
			get: () => secondDocument,
		} );
		act( () => secondIframe.dispatchEvent( new Event( 'load' ) ) );
		act( () => {
			secondDocument.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true } )
			);
		} );

		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
	} );
} );
