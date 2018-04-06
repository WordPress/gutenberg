/**
 * Node dependencies
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * External dependencies
 */
import rimraf from 'rimraf';
import { uniq } from 'lodash';

const parserBinary = process.env.BINARY;
const fixturesDir = path.join( __dirname, 'fixtures' );
const tempDir = path.join( __dirname, 'temp' );

// We expect 2 different types of files for each fixture:
//  - fixture.html            : original content
//  - fixture.parsed.json     : parser output
const fileBasenames = uniq(
	fs.readdirSync( fixturesDir )
		.filter( f => /(\.html|\.json)$/.test( f ) )
		.map( f => f.replace( /\..+$/, '' ) )
);

describe( 'parser', () => {
	beforeAll( () => {
		rimraf.sync( tempDir );
		fs.mkdirSync( tempDir );
	} );

	afterEach( () => {
		rimraf.sync( tempDir );
	} );

	fileBasenames.forEach( f => {
		it( f, ( done ) => {
			const inputFile = path.resolve( fixturesDir, f + '.html' );
			const temporaryFileOutput = path.resolve( tempDir, f + '.json' );

			exec( `${ parserBinary } ${ inputFile } ${ temporaryFileOutput }`, ( err ) => {
				if ( err ) {
					throw new Error(
						'Parsing error for fixture file: ' + f
					);
				}

				const parserOutput = fs.readFileSync( temporaryFileOutput, 'utf8' );
				expect( JSON.parse( parserOutput ) ).toMatchSnapshot();
				done();
			} );
		} );
	} );
} );
