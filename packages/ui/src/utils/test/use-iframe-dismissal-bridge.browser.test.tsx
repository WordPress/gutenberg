import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { IframeDismissalHarness } from './fixtures/iframe-dismissal-harness';

describe( 'useIframeDismissalBridge', () => {
	it( 'stays open for a press inside an iframe in its popup', async () => {
		const onPopupClick = vi.fn();
		await render( <IframeDismissalHarness popupIframe /> );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Actions' } )
		);
		await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();

		const iframe = screen.getByTitle< HTMLIFrameElement >( 'Popup frame' );
		const iframeDocument = iframe.contentDocument;
		if ( ! iframeDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}
		const button = iframeDocument.createElement( 'button' );
		button.textContent = 'Inside popup';
		button.addEventListener( 'click', onPopupClick );
		iframeDocument.body.appendChild( button );

		await page
			.frameLocator( page.getByTitle( 'Popup frame' ) )
			.getByRole( 'button', { name: 'Inside popup' } )
			.click();

		expect( onPopupClick ).toHaveBeenCalledTimes( 1 );
		await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();
	} );

	it( 'closes on a nested same-origin iframe pointer interaction', async () => {
		const user = userEvent;

		await render( <IframeDismissalHarness /> );

		const editorIframe =
			screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
		const editorDocument = editorIframe.contentDocument;

		if ( ! editorDocument ) {
			throw new Error( 'Expected a same-origin iframe document.' );
		}

		await user.click( screen.getByRole( 'button', { name: 'Actions' } ) );
		await expect.element( page.getByRole( 'dialog' ) ).toBeVisible();

		const nestedIframe = editorDocument.createElement( 'iframe' );
		nestedIframe.title = 'Nested canvas';
		editorDocument.body.appendChild( nestedIframe );
		const nestedDocument = nestedIframe.contentDocument;

		if ( ! nestedDocument ) {
			throw new Error( 'Expected a nested same-origin iframe document.' );
		}

		const canvasTarget = nestedDocument.createElement( 'button' );
		canvasTarget.textContent = 'Edit nested block';
		nestedDocument.body.appendChild( canvasTarget );

		const nestedAddEventListener = vi.spyOn(
			nestedDocument,
			'addEventListener'
		);
		await waitFor( () => {
			expect( nestedAddEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				expect.any( Function ),
				true
			);
		} );

		const editorFrame = page.frameLocator(
			page.getByTitle( 'Editor canvas' )
		);
		const nestedFrame = page.frameLocator(
			editorFrame.getByTitle( 'Nested canvas' )
		);
		await nestedFrame
			.getByRole( 'button', { name: 'Edit nested block' } )
			.click();

		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
	} );
} );
