/**
 * Node dependencies
 */
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import peg from 'pegjs';

/**
 * External dependencies
 */
import rimraf from 'rimraf';
import { uniq } from 'lodash';

/**
 * Module constants
 */
const grammarFile = path.join( __dirname, '../../blocks/api/post.pegjs' );
const parserExecutable = process.env.PARSER;
const fixturesDir = path.join( __dirname, 'fixtures' );
const tempDir = path.join( __dirname, 'temp' );
const defaultParser = peg.generate( fs.readFileSync( grammarFile, 'utf8' ) );

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

			exec( `${ parserExecutable } ${ inputFile } ${ temporaryFileOutput }`, ( err ) => {
				if ( err ) {
					throw new Error(
						'Parsing error for fixture file: ' + f
					);
				}

				const parserInput = fs.readFileSync( inputFile, 'utf8' );
				const parserOutput = fs.readFileSync( temporaryFileOutput, 'utf8' );
				expect( JSON.parse( parserOutput ) ).toEqual( defaultParser.parse( parserInput ) );
				done();
			} );
		} );
	} );
} );
