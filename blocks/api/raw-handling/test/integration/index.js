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

const types = [
	'plain',
	'apple',
	'google-docs',
	'ms-word',
	'ms-word-online',
];

describe( 'raw handling: integration', () => {
	beforeAll( () => {
		// Load all hooks that modify blocks
		require( 'blocks/hooks' );

		// TODO: Need to load/register core blocks. Maybe requireIndex ?
	} );

	types.forEach( ( type ) => {
		it( type, () => {
			const input = fs.readFileSync( path.join( __dirname, `${ type }-in.html` ), 'utf8' ).trim();
			const output = fs.readFileSync( path.join( __dirname, `${ type }-out.html` ), 'utf8' ).trim();
			const converted = rawHandler( { HTML: input } );
			const serialized = typeof converted === 'string' ? converted : serialize( converted );

			equal( output, serialized );
		} );
	} );
} );
