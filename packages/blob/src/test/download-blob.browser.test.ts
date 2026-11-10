import { describe, expect, it, vi } from 'vitest';
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
		const createObjectURL = vi.spyOn( URL, 'createObjectURL' );
		const revokeObjectURL = vi.spyOn( URL, 'revokeObjectURL' );
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
			const blob = createObjectURL.mock.calls[ 0 ][ 0 ] as Blob;
			const objectURL = createObjectURL.mock.results[ 0 ].value;

			expect( anchor ).toBeDefined();
			expect( anchor?.download ).toBe( 'filename.json' );
			expect( anchor?.href ).toBe( objectURL );
			expect( anchor?.style.display ).toBe( 'none' );
			expect( clickedAnchor ).toBe( anchor );
			expect( anchor?.isConnected ).toBe( false );
			expect( blob.type ).toBe( 'application/json' );
			expect( await blob.text() ).toBe( '{}' );
			expect( revokeObjectURL ).toHaveBeenCalledExactlyOnceWith(
				objectURL
			);
		} finally {
			document.removeEventListener( 'click', preventDownload, true );
		}
	} );
} );
