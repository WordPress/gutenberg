import { screen } from '@testing-library/react';
import { page } from 'vitest/browser';

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
