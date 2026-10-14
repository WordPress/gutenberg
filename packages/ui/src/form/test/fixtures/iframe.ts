import type { CDPSession } from '@vitest/browser-playwright';
import { screen, within } from '@testing-library/react';
import { cdp, page } from 'vitest/browser';

export function addCanvasButton( onClick: () => void ) {
	const iframe = screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
	const iframeDocument = iframe.contentDocument;
	if ( ! iframeDocument ) {
		throw new Error( 'Expected a same-origin iframe document.' );
	}

	const button = iframeDocument.createElement( 'button' );
	button.textContent = 'Edit block';
	button.addEventListener( 'click', onClick );
	iframeDocument.body.appendChild( button );
	return page
		.frameLocator( page.elementLocator( iframe ) )
		.getByRole( 'button', { name: 'Edit block' } );
}

export async function tapCanvasButton() {
	const iframe = screen.getByTitle< HTMLIFrameElement >( 'Editor canvas' );
	const iframeDocument = iframe.contentDocument;
	if ( ! iframeDocument ) {
		throw new Error( 'Expected a same-origin iframe document.' );
	}
	const button = within( iframeDocument.body ).getByRole( 'button', {
		name: 'Edit block',
	} );
	const buttonRect = button.getBoundingClientRect();
	let x = buttonRect.left + buttonRect.width / 2;
	let y = buttonRect.top + buttonRect.height / 2;
	let frame: Element | null = iframe;
	while ( frame ) {
		const frameRect = frame.getBoundingClientRect();
		x += frameRect.left + frame.clientLeft;
		y += frameRect.top + frame.clientTop;
		frame = frame.ownerDocument.defaultView?.frameElement ?? null;
	}
	const session: CDPSession = cdp();
	await session.send( 'Emulation.setTouchEmulationEnabled', {
		enabled: true,
	} );
	try {
		await session.send( 'Input.dispatchTouchEvent', {
			type: 'touchStart',
			touchPoints: [ { x, y } ],
		} );
		await session.send( 'Input.dispatchTouchEvent', {
			type: 'touchEnd',
			touchPoints: [],
		} );
	} finally {
		await session.send( 'Emulation.setTouchEmulationEnabled', {
			enabled: false,
		} );
	}
}
