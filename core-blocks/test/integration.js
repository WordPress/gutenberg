/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * WordPress dependencies
 */
import { rawHandler, serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../';

const types = [
	'plain',
	'classic',
	'apple',
	'google-docs',
	'ms-word',
	'ms-word-online',
	'evernote',
	'iframe-embed',
	'one-image',
	'two-images',
	'markdown',
	'wordpress',
];

function readFile( filePath ) {
	return fs.existsSync( filePath ) ? fs.readFileSync( filePath, 'utf8' ).trim() : '';
}

describe( 'raw handling: integration', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'editor/hooks' );
		registerCoreBlocks();
	} );

	types.forEach( ( type ) => {
		it( type, () => {
			const HTML = readFile( path.join( __dirname, `integration/${ type }-in.html` ) );
			const plainText = readFile( path.join( __dirname, `integration/${ type }-in.txt` ) );
			const output = readFile( path.join( __dirname, `integration/${ type }-out.html` ) );
			const converted = rawHandler( { HTML, plainText, canUserUseUnfilteredHTML: true } );
			const serialized = typeof converted === 'string' ? converted : serialize( converted );

			expect( serialized ).toBe( output );
		} );
	} );
} );
