// @wordpress/element does not export React's test-only act helper.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { act } from 'react';
import { createElement, createRoot } from '@wordpress/element';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { useServerSideRender } from '../hook';

vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );
vi.mock( '@wordpress/blocks', () => ( {
	sanitizeBlockAttributes: (
		_block: string,
		attributes: Record< string, unknown >
	) => attributes,
} ) );

describe( 'editor content transport', () => {
	let root: ReturnType< typeof createRoot >;
	let container: HTMLDivElement;

	beforeEach( () => {
		vi.mocked( apiFetch ).mockResolvedValue( {
			rendered: '<nav>Preview</nav>',
		} );
		container = document.createElement( 'div' );
		document.body.appendChild( container );
		root = createRoot( container );
	} );

	afterEach( async () => {
		await act( async () => root.unmount() );
		container.remove();
		vi.clearAllMocks();
	} );

	it.each( [
		'<!-- wp:heading --><h2>Editor heading</h2><!-- /wp:heading -->',
		'',
	] )(
		'sends editor content %j in the POST body outside attributes and the URL',
		async ( editorContent ) => {
			function Preview() {
				useServerSideRender( {
					block: 'core/table-of-contents',
					attributes: { ordered: true },
					httpMethod: 'POST',
					postContent: editorContent,
					urlQueryArgs: { post_id: 42 },
				} );
				return null;
			}

			const mount = () => root.render( createElement( Preview ) );
			await act( async () => mount() );
			const waitForRequest = () =>
				vi.waitFor( () =>
					expect( apiFetch ).toHaveBeenCalledTimes( 1 )
				);
			await act( waitForRequest );

			const options = vi.mocked( apiFetch ).mock.calls[ 0 ][ 0 ];
			expect( options.method ).toBe( 'POST' );
			expect( options.path ).toBe(
				'/wp/v2/block-renderer/core/table-of-contents?context=edit&post_id=42'
			);
			expect( JSON.parse( options.body as string ) ).toEqual( {
				attributes: { ordered: true },
				post_content: editorContent,
			} );
			expect( options.headers ).toEqual( {
				'Content-Type': 'application/json',
			} );
		}
	);
} );
