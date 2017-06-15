/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { uniq, isObject, omit, startsWith } from 'lodash';
import { expect } from 'chai';
import { format } from 'util';

/**
 * Internal dependencies
 */
import parse from '../api/parser';
import serialize from '../api/serializer';
import { getBlockTypes } from '../api/registration';

const fixturesDir = path.join( __dirname, 'fixtures' );

// We expect 3 different types of files for each fixture:
//  - fixture.html - original content
//  - fixture.json - blocks structure
//  - fixture.serialized.html - re-serialized content
// Get the "base" name for each fixture first.
const fileBasenames = uniq(
	fs.readdirSync( fixturesDir )
		.filter( f => /(\.html|\.json)$/.test( f ) )
		.map( f => f.replace( /\..+$/, '' ) )
);

function readFixtureFile( filename ) {
	try {
		return fs.readFileSync(
			path.join( fixturesDir, filename ),
			'utf8'
		);
	} catch ( err ) {
		return null;
	}
}

function writeFixtureFile( filename, content ) {
	fs.writeFileSync(
		path.join( fixturesDir, filename ),
		content
	);
}

function normalizeReactTree( element ) {
	if ( Array.isArray( element ) ) {
		return element.map( child => normalizeReactTree( child ) );
	}

	// Check if we got an object first, then if it actually has a `type` like a
	// React component.  Sometimes we get other stuff here, which probably
	// indicates a bug.
	if ( isObject( element ) && element.type ) {
		const toReturn = {
			type: element.type,
		};
		const attributes = omit( element.props, 'children' );
		if ( Object.keys( attributes ).length ) {
			toReturn.attributes = attributes;
		}
		if ( element.props.children ) {
			toReturn.children = normalizeReactTree( element.props.children );
		}
		return toReturn;
	}

	return element;
}

function normalizeParsedBlocks( blocks ) {
	return blocks.map( ( block, index ) => {
		// Clone and remove React-instance-specific stuff; also, attribute
		// values that equal `undefined` will be removed
		block = JSON.parse( JSON.stringify( block ) );
		// Change unique UIDs to a predictable value
		block.uid = '_uid_' + index;
		// Walk each attribute and get a more concise representation of any
		// React elements
		for ( const k in block.attributes ) {
			block.attributes[ k ] = normalizeReactTree( block.attributes[ k ] );
		}
		return block;
	} );
}

describe( 'full post content fixture', () => {
	fileBasenames.forEach( f => {
		it( f, () => {
			const content = readFixtureFile( f + '.html' );

			const blocksActual = parse( content );
			const blocksActualNormalized = normalizeParsedBlocks( blocksActual );
			let blocksExpectedString = readFixtureFile( f + '.json' );

			if ( ! blocksExpectedString ) {
				if ( process.env.GENERATE_MISSING_FIXTURES ) {
					blocksExpectedString = JSON.stringify(
						blocksActualNormalized,
						null,
						4
					) + '\n';
					writeFixtureFile( f + '.json', blocksExpectedString );
				} else {
					throw new Error(
						'Missing fixture file: ' + f + '.json'
					);
				}
			}

			const blocksExpected = JSON.parse( blocksExpectedString );
			expect( blocksActualNormalized ).to.eql( blocksExpected );

			const serializedActual = serialize( blocksActual );
			let serializedExpected = readFixtureFile( f + '.serialized.html' );

			if ( ! serializedExpected ) {
				if ( process.env.GENERATE_MISSING_FIXTURES ) {
					serializedExpected = serializedActual;
					writeFixtureFile( f + '.serialized.html', serializedExpected );
				} else {
					throw new Error(
						'Missing fixture file: ' + f + '.serialized.html'
					);
				}
			}

			expect( serializedActual.trim() ).to.eql( serializedExpected.trim() );
		} );
	} );

	it( 'should be present for each block', () => {
		const errors = [];

		getBlockTypes().map( block => block.name ).forEach( name => {
			const nameToFilename = name.replace( /\//g, '-' );
			const foundFixtures = fileBasenames
				.filter( basename => (
					basename === nameToFilename ||
					startsWith( basename, nameToFilename + '-' )
				) )
				.map( basename => {
					const filename = basename + '.html';
					return {
						filename,
						contents: readFixtureFile( filename ),
					};
				} )
				.filter( fixture => fixture.contents !== null );

			if ( ! foundFixtures.length ) {
				errors.push( format(
					'Expected a fixture file called \'%s.html\' or \'%s-*.html\'.',
					nameToFilename,
					nameToFilename
				) );
			}

			foundFixtures.forEach( fixture => {
				const delimiter = new RegExp(
					'<!--\\s*wp:' + name + '(\\s+|\\s*-->)'
				);
				if ( ! delimiter.test( fixture.contents ) ) {
					errors.push( format(
						'Expected fixture file \'%s\' to test the \'%s\' block.',
						fixture.filename,
						name
					) );
				}
			} );
		} );

		if ( errors.length ) {
			throw new Error(
				'Problem(s) with fixture files:\n\n' + errors.join( '\n' )
			);
		}
	} );
} );
