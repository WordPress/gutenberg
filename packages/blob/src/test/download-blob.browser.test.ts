import { describe, expect, it } from 'vitest';
import { downloadBlob } from '..';

async function observeAddedNodes( callback: () => void ) {
	const addedNodes: Node[] = [];
	const observer = new MutationObserver( ( mutations ) => {
		for ( const mutation of mutations ) {
			addedNodes.push( ...mutation.addedNodes );
		}
	} );
	observer.observe( document.body, { childList: true } );

	callback();
	await new Promise< void >( ( resolve ) => queueMicrotask( resolve ) );
	observer.disconnect();

	return addedNodes;
}

describe( 'downloadBlob', () => {
	it( 'requires a filename argument', async () => {
		const addedNodes = await observeAddedNodes( () => {
			downloadBlob( '', '{}', 'application/json' );
		} );

		expect( addedNodes ).toHaveLength( 0 );
	} );

	it( 'requires a content argument', async () => {
		const addedNodes = await observeAddedNodes( () => {
			downloadBlob( 'text.txt', '', 'text/plain' );
		} );

		expect( addedNodes ).toHaveLength( 0 );
	} );

	it( 'constructs a hidden anchor and removes it', async () => {
		let clickedAnchor: HTMLAnchorElement | undefined;
		const preventDownload = ( event: MouseEvent ) => {
			if ( event.target instanceof HTMLAnchorElement ) {
				clickedAnchor = event.target;
				event.preventDefault();
			}
		};
		document.addEventListener( 'click', preventDownload, true );

		try {
			const addedNodes = await observeAddedNodes( () => {
				downloadBlob( 'filename.json', '{}', 'application/json' );
			} );
			const anchor = addedNodes.find(
				( node ): node is HTMLAnchorElement =>
					node instanceof HTMLAnchorElement
			);

			expect( anchor ).toBeDefined();
			expect( anchor?.download ).toBe( 'filename.json' );
			expect( anchor?.href ).toMatch( /^blob:/ );
			expect( anchor?.style.display ).toBe( 'none' );
			expect( clickedAnchor ).toBe( anchor );
			expect( anchor?.isConnected ).toBe( false );
		} finally {
			document.removeEventListener( 'click', preventDownload, true );
		}
	} );
} );
