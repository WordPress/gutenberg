/**
 * WordPress dependencies
 */
import { pasteHandler, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

describe( 'Handling of non matched tags in block transforms', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks.
		require( '../../packages/editor/src/hooks' );
		registerCoreBlocks();
	} );
	it( 'correctly pastes preformatted tag even if preformatted block is removed', async () => {
		unregisterBlockType( 'core/preformatted' );
		const simplePreformattedResult = await pasteHandler( {
			HTML: '<pre>Pre</pre>',
			mode: 'AUTO',
		} );

		expect( simplePreformattedResult ).toHaveLength( 1 );
		expect( simplePreformattedResult[ 0 ].name ).toBe( 'core/paragraph' );
		expect(
			simplePreformattedResult[ 0 ].attributes.content.valueOf()
		).toBe( 'Pre' );

		const codeResult = await pasteHandler( {
			HTML: '<pre><code>code</code></pre>',
			mode: 'AUTO',
		} );

		expect( codeResult ).toHaveLength( 1 );
		expect( codeResult[ 0 ].name ).toBe( 'core/code' );
		expect( codeResult[ 0 ].attributes.content.valueOf() ).toBe( 'code' );
		expect( console ).toHaveLogged();
	} );
} );
