/**
 * Internal dependencies
 */
import '../globals';

/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse } from '@wordpress/blocks';

registerCoreBlocks();

describe( 'Parser', () => {
	const innerContent = `
		if name == "World":
			return "Hello World"
		else:
			return "Hello Pony"`;

	const originalBlockHtml = `<p>${ innerContent }</p>`;

	const gbBlockHtml = `
		<!-- wp:paragraph -->
		${ originalBlockHtml }
		<!-- /wp:code -->`;

	it( 'parses the paragraph block ok', () => {
		const blockInstance = parse( gbBlockHtml )[ 0 ];
		expect( blockInstance ).toBeTruthy();
	} );

	it( 'parses the paragraph block content ok', () => {
		const blockInstance = parse( gbBlockHtml )[ 0 ];

		expect( blockInstance.isValid ).toEqual( true );
		expect( blockInstance.name ).toEqual( 'core/paragraph' );
		expect( blockInstance.innerBlocks ).toHaveLength( 0 );
		expect( blockInstance.originalContent ).toEqual( originalBlockHtml );
	} );
} );
