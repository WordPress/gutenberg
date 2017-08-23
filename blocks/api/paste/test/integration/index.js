/**
 * External dependencies
 */
import { equal } from 'assert';
import fs from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import '../../../../library';
import paste from '../../index';
import serialize from '../../../serializer';

const types = [
	'plain',
	'apple',
	'google-docs',
	'ms-word',
	'ms-word-online',
];

describe( 'paste: integration', () => {
	types.forEach( ( type ) => {
		it( type, () => {
			const input = fs.readFileSync( path.join( __dirname, `${ type }-in.html` ), 'utf8' ).trim();
			const output = fs.readFileSync( path.join( __dirname, `${ type }-out.html` ), 'utf8' ).trim();
			const pasted = paste( { content: input } );
			const serialized = typeof pasted === 'string' ? pasted : serialize( pasted );

			equal( output, serialized );
		} );
	} );
} );
