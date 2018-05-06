/**
 * External dependencies
 */
import { equal } from 'assert';
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import rawHandler from '../../index';
import serialize from '../../../serializer';

import { registerCoreBlocks } from '../../../../test/helpers';

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
		require( 'blocks/hooks' );

		registerCoreBlocks();
	} );

	types.forEach( ( type ) => {
		it( type, () => {
			const HTML = readFile( path.join( __dirname, `${ type }-in.html` ) );
			const plainText = readFile( path.join( __dirname, `${ type }-in.txt` ) );
			const output = readFile( path.join( __dirname, `${ type }-out.html` ) );
			const converted = rawHandler( { HTML, plainText, canUserUseUnfilteredHTML: true } );
			const serialized = typeof converted === 'string' ? converted : serialize( converted );

			equal( serialized, output );
		} );
	} );
} );
