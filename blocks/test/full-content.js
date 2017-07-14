/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import { uniq, isObject, omit, startsWith } from 'lodash';
import { format } from 'util';

/**
 * Internal dependencies
 */
import parse from '../api/parser';
import { parse as grammarParse } from '../api/post.pegjs';
import serialize from '../api/serializer';
import { getBlockTypes } from '../api/registration';

const fixturesDir = path.join( __dirname, 'fixtures' );

// Get the "base" name for each fixture first.
const fileBasenames = uniq(
	fs.readdirSync( fixturesDir )
		.filter( f => /\.html$/.test( f ) )
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

function normalizeReactTree( element ) {
	if ( Array.isArray( element ) ) {
		return element.map( child => normalizeReactTree( child ) );
	}

	// Check if we got an object first, then if it actually has a `type` like a
	// React component.  Sometimes we get other stuff here, which probably
	// indicates a bug.
	if ( isObject( element ) && element.type && element.props ) {
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
	beforeAll( () => {
		// Register all blocks.
		require( 'blocks' );
	} );

	it( 'has 54 fixtures', () => {
		expect( fileBasenames ).toHaveLength( 54 );
	} );

	fileBasenames.forEach( f => {
		describe( f, () => {
			let content;

			beforeAll( () => {
				content = readFixtureFile( f + '.html' );
			} );

			it( `has non empty fixture file ${ f }.html`, () => {
				expect( content ).toBeTruthy();
			} );

			it( 'gets parsed properly', () => {
				const parserOutput = grammarParse( content );

				expect( parserOutput ).toMatchSnapshot();
			} );

			it( 'gets blocks normalized properly', () => {
				const blocks = parse( content );
				const blocksNormalized = normalizeParsedBlocks( blocks );

				expect( blocksNormalized ).toMatchSnapshot();
			} );

			it( 'gets parsed and serialized properly', () => {
				const blocks = parse( content );
				const serialized = serialize( blocks );

				expect( serialized ).toMatchSnapshot();
			} );
		} );
	} );

	it( 'should be present for each block', () => {
		const errors = [];
		const blockTypes = getBlockTypes();

		expect( blockTypes ).toHaveLength( 51 );

		blockTypes.map( block => block.name ).forEach( name => {
			const nameToFilename = name.replace( /\//g, '__' );
			const foundFixtures = fileBasenames
				.filter( basename => (
					basename === nameToFilename ||
					startsWith( basename, nameToFilename + '__' )
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
					'Expected a fixture file called \'%s.html\' or \'%s__*.html\'.',
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
