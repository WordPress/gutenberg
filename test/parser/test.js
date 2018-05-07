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
import { uniq } from 'lodash';
import consoleTable from 'console.table';

/**
 * Module constants
 */
const grammarFile = path.join( __dirname, '../../blocks/api/post.pegjs' );
const parserExecutable = process.env.PARSER;
const fixturesDir = path.join( __dirname, 'fixtures' );
const defaultParser = peg.generate( fs.readFileSync( grammarFile, 'utf8' ) );
const fileBasenames = uniq(
	fs.readdirSync( fixturesDir )
		.filter( f => /(\.html|\.json)$/.test( f ) )
		.map( f => f.replace( /\..+$/, '' ) )
);
const durations = [];

describe( 'parser', () => {
	fileBasenames.forEach( f => {
		it( f, ( done ) => {
			const inputFile = path.resolve( fixturesDir, f + '.html' );
			const start = Date.now();
			exec( `cat ${ inputFile } | ${ parserExecutable }`, ( err, parserOutput ) => {
				const end = Date.now();
				if ( err ) {
					throw new Error(
						'Parsing error for fixture file: ' + f
					);
				}
				const parserInput = fs.readFileSync( inputFile, 'utf8' );
				expect( JSON.parse( parserOutput ) ).toEqual( defaultParser.parse( parserInput ) );
				durations.push( { name: f, duration: end - start } );
				done();
			} );
		} );
	} );

	afterAll( () => {
		// eslint-disable-next-line no-console
		console.log( consoleTable.getTable( durations ) );
	} );
} );

