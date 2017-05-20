/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { uniq } from 'lodash';
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import {
	// parseWithGrammar,
	parseWithTinyMCE,
} from '../api/parser';
import serialize from '../api/serializer';

const fixturesDir = path.join( __dirname, 'fixtures' );

// We expect 3 different types of files for each fixture:
//  - fixture.html - original content
//  - fixture.json - blocks structure
//  - fixture.serialized.html - re-serialized content
// Get the "base" name for each fixture first.
const fileBasenames = uniq(
	fs.readdirSync( fixturesDir )
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

function normalizeParsedBlocks( blocks ) {
	return blocks.map( ( block, index ) => {
		// Clone and remove React-instance-specific stuff; also attribute
		// values that equal `undefined` will be removed
		block = JSON.parse( JSON.stringify( block ) );
		// Change unique UIDs to a predictable value
		block.uid = '_uid_' + index;
		return block;
	} );
}

describe( 'full post content fixture', () => {
	fileBasenames.forEach( f => {
		it( f, () => {
			const content = readFixtureFile( f + '.html' );

			const blocksActual = parseWithTinyMCE( content );
			const blocksActualNormalized = normalizeParsedBlocks( blocksActual );
			let blocksExpectedString = readFixtureFile( f + '.json' );

			if ( ! blocksExpectedString ) {
				if ( process.env.GENERATE_MISSING_FIXTURES ) {
					blocksExpectedString = JSON.stringify(
						blocksActualNormalized,
						null,
						4
					);
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

			expect( serializedActual ).to.eql( serializedExpected );
		} );
	} );
} );
