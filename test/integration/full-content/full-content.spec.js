/**
 * External dependencies
 */
import { startsWith, get } from 'lodash';
import { format } from 'util';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	parse,
	serialize,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '@wordpress/blocks';
import { parse as grammarParse } from '@wordpress/block-serialization-default-parser';
import { registerCoreBlocks } from '@wordpress/block-library';
import { //eslint-disable-line no-restricted-syntax
	blockNameToFixtureBaseName,
	getAvailableBlockFixturesBaseNames,
	getBlockFixtureHTML,
	getBlockFixtureJSON,
	getBlockFixtureParsedJSON,
	getBlockFixtureSerializedHTML,
	writeBlockFixtureParsedJSON,
	writeBlockFixtureJSON,
	writeBlockFixtureSerializedHTML,
} from '@wordpress/e2e-tests/fixtures';

const blockBaseNames = getAvailableBlockFixturesBaseNames();

function normalizeParsedBlocks( blocks ) {
	return blocks.map( ( block, index ) => {
		// Clone and remove React-instance-specific stuff; also, attribute
		// values that equal `undefined` will be removed
		block = JSON.parse( JSON.stringify( block ) );

		// Change client IDs to a predictable value
		block.clientId = '_clientId_' + index;

		// Recurse to normalize inner blocks
		block.innerBlocks = normalizeParsedBlocks( block.innerBlocks );

		return block;
	} );
}

describe( 'full post content fixture', () => {
	beforeAll( () => {
		unstable__bootstrapServerSideBlockDefinitions( require( './server-registered.json' ) );

		// Load all hooks that modify blocks
		require( '../../../packages/editor/src/hooks' );
		registerCoreBlocks();
	} );

	blockBaseNames.forEach( ( baseName ) => {
		it( baseName, () => {
			const {
				fileName: htmlFixtureFileName,
				file: htmlFixtureContent,
			} = getBlockFixtureHTML( baseName );
			if ( htmlFixtureContent === null ) {
				throw new Error(
					`Missing fixture file: ${ htmlFixtureFileName }`
				);
			}

			const {
				fileName: parsedJSONFixtureFileName,
				file: parsedJSONFixtureContent,
			} = getBlockFixtureParsedJSON( baseName );
			const parserOutputActual = grammarParse( htmlFixtureContent );
			let parserOutputExpectedString;
			if ( parsedJSONFixtureContent ) {
				parserOutputExpectedString = parsedJSONFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				parserOutputExpectedString = JSON.stringify(
					parserOutputActual,
					null,
					4
				) + '\n';
				writeBlockFixtureParsedJSON( baseName, parserOutputExpectedString );
			} else {
				throw new Error(
					`Missing fixture file: ${ parsedJSONFixtureFileName }`
				);
			}

			const parserOutputExpected = JSON.parse( parserOutputExpectedString );
			try {
				expect(
					parserOutputActual
				).toEqual( parserOutputExpected );
			} catch ( err ) {
				throw new Error( format(
					"File '%s' does not match expected value:\n\n%s",
					parsedJSONFixtureFileName,
					err.message
				) );
			}

			const blocksActual = parse( htmlFixtureContent );

			// Block validation may log errors during deprecation migration,
			// unless explicitly handled from a valid block via isEligible.
			// Match on baseName for deprecated blocks fixtures to allow.
			const isDeprecated = /__deprecated([-_]|$)/.test( baseName );
			if ( isDeprecated ) {
				/* eslint-disable no-console */
				console.warn.mockReset();
				console.error.mockReset();
				/* eslint-enable no-console */
			}

			const blocksActualNormalized = normalizeParsedBlocks( blocksActual );
			const {
				fileName: jsonFixtureFileName,
				file: jsonFixtureContent,
			} = getBlockFixtureJSON( baseName );

			let blocksExpectedString;

			if ( jsonFixtureContent ) {
				blocksExpectedString = jsonFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				blocksExpectedString = JSON.stringify(
					blocksActualNormalized,
					null,
					4
				) + '\n';
				writeBlockFixtureJSON( baseName, blocksExpectedString );
			} else {
				throw new Error(
					`Missing fixture file: ${ jsonFixtureFileName }`
				);
			}

			const blocksExpected = JSON.parse( blocksExpectedString );
			try {
				expect(
					blocksActualNormalized
				).toEqual( blocksExpected );
			} catch ( err ) {
				throw new Error( format(
					"File '%s' does not match expected value:\n\n%s",
					jsonFixtureFileName,
					err.message
				) );
			}

			// `serialize` doesn't have a trailing newline, but the fixture
			// files should.
			const serializedActual = serialize( blocksActual ) + '\n';
			const {
				fileName: serializedHTMLFileName,
				file: serializedHTMLFixtureContent,
			} =	getBlockFixtureSerializedHTML( baseName );

			let serializedExpected;
			if ( serializedHTMLFixtureContent ) {
				serializedExpected = serializedHTMLFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				serializedExpected = serializedActual;
				writeBlockFixtureSerializedHTML( baseName, serializedExpected );
			} else {
				throw new Error(
					`Missing fixture file: ${ serializedHTMLFileName }`
				);
			}

			try {
				expect( serializedActual ).toEqual( serializedExpected );
			} catch ( err ) {
				throw new Error( format(
					"File '%s' does not match expected value:\n\n%s",
					serializedHTMLFileName,
					err.message
				) );
			}
		} );
	} );

	it( 'should be present for each block', () => {
		const errors = [];

		getBlockTypes()
			.map( ( block ) => block.name )
			// We don't want tests for each oembed provider, which all have the same
			// `save` functions and attributes.
			// The `core/template` is not worth testing here because it's never saved, it's covered better in e2e tests.
			.filter( ( name ) => name.indexOf( 'core-embed' ) !== 0 && name !== 'core/template' )
			.forEach( ( name ) => {
				const nameToFilename = blockNameToFixtureBaseName( name );
				const foundFixtures = blockBaseNames
					.filter( ( baseName ) => (
						baseName === nameToFilename ||
						startsWith( baseName, nameToFilename + '__' )
					) )
					.map( ( baseName ) => {
						const {
							fileName: htmlFixtureFileName,
						} = getBlockFixtureHTML( baseName );
						const {
							file: jsonFixtureContent,
						} = getBlockFixtureJSON( baseName );
						// The parser output for this test.  For missing files,
						// JSON.parse( null ) === null.
						const parserOutput = JSON.parse(
							jsonFixtureContent,
						);
						// The name of the first block that this fixture file
						// contains (if any).
						const firstBlock = get( parserOutput, [ '0', 'name' ], null );
						return {
							filename: htmlFixtureFileName,
							parserOutput,
							firstBlock,
						};
					} )
					.filter( ( fixture ) => fixture.parserOutput !== null );

				if ( ! foundFixtures.length ) {
					errors.push( format(
						"Expected a fixture file called '%s.html' or '%s__*.html'.",
						nameToFilename,
						nameToFilename
					) );
				}

				foundFixtures.forEach( ( fixture ) => {
					if ( name !== fixture.firstBlock ) {
						errors.push( format(
							"Expected fixture file '%s' to test the '%s' block.",
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
