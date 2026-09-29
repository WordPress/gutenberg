import { beforeAll, describe, expect, it, vi } from 'vitest';
import { pasteHandler, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import '../../packages/editor/src/hooks';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'Handling of non matched tags in block transforms', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );
	it( 'correctly pastes preformatted tag even if preformatted block is removed', () => {
		unregisterBlockType( 'core/preformatted' );
		const simplePreformattedResult = pasteHandler( {
			HTML: '<pre>Pre</pre>',
			mode: 'AUTO',
		} );

		expect( simplePreformattedResult ).toHaveLength( 1 );
		expect( simplePreformattedResult[ 0 ].name ).toBe( 'core/paragraph' );
		expect(
			simplePreformattedResult[ 0 ].attributes.content.valueOf()
		).toBe( 'Pre' );

		const codeResult = pasteHandler( {
			HTML: '<pre><code>code</code></pre>',
			mode: 'AUTO',
		} );

		expect( codeResult ).toHaveLength( 1 );
		expect( codeResult[ 0 ].name ).toBe( 'core/code' );
		expect( codeResult[ 0 ].attributes.content.valueOf() ).toBe( 'code' );
		expect( console ).toHaveLogged();
	} );
} );
