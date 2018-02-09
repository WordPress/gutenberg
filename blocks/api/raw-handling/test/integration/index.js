/**
 * External dependencies
 */
import { equal } from 'assert';
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { registerCoreBlocks } from '../../../../library';
import rawHandler from '../../index';
import serialize from '../../../serializer';

const types = [
	'plain',
	'apple',
	'google-docs',
	'ms-word',
	'ms-word-online',
	'evernote',
	'iframe-embed',
	'one-image',
	'two-images',
];

describe( 'raw handling: integration', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'blocks/hooks' );
		registerCoreBlocks();
	} );

	types.forEach( ( type ) => {
		it( type, () => {
			const input = fs.readFileSync( path.join( __dirname, `${ type }-in.html` ), 'utf8' ).trim();
			const output = fs.readFileSync( path.join( __dirname, `${ type }-out.html` ), 'utf8' ).trim();
			const converted = rawHandler( { HTML: input, canUserUseUnfilteredHTML: true } );
			const serialized = typeof converted === 'string' ? converted : serialize( converted );

			equal( output, serialized );
		} );
	} );
} );
