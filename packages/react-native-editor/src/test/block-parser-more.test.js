/**
 * WordPress dependencies
 */
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse } from '@wordpress/blocks';

registerCoreBlocks();

describe( 'Parser', () => {
	const originalMoreBlockHtml = '<!--more-->';

	const gbMoreBlockHtml = `
		<!-- wp:more -->
		${ originalMoreBlockHtml }
		<!-- /wp:more -->`;

	it( 'parses the more block ok', () => {
		const moreBlockInstance = parse( gbMoreBlockHtml )[ 0 ];
		expect( moreBlockInstance ).toBeTruthy();
	} );

	it( 'parses the more block attributes ok', () => {
		const moreBlockInstance = parse( gbMoreBlockHtml )[ 0 ];

		expect( moreBlockInstance.isValid ).toEqual( true );
		expect( moreBlockInstance.name ).toEqual( 'core/more' );
		expect( moreBlockInstance.innerBlocks ).toHaveLength( 0 );
		expect( moreBlockInstance.originalContent ).toEqual(
			originalMoreBlockHtml
		);
	} );
} );
