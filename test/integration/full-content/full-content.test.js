/**
 * External dependencies
 */
import glob from 'fast-glob';
import { fromPairs, omit, startsWith, get } from 'lodash';
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
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import prettierConfig from '@wordpress/prettier-config';

/**
 * Internal dependencies
 */
import {
	blockNameToFixtureBasename,
	getAvailableBlockFixturesBasenames,
	getBlockFixtureHTML,
	getBlockFixtureJSON,
	getBlockFixtureParsedJSON,
	getBlockFixtureSerializedHTML,
	writeBlockFixtureParsedJSON,
	writeBlockFixtureJSON,
	writeBlockFixtureSerializedHTML,
} from '../fixtures';

const blockBasenames = getAvailableBlockFixturesBasenames();

function normalizeParsedBlocks( blocks ) {
	return blocks.map( ( block, index ) => {
		// Clone and remove React-instance-specific stuff; also, attribute
		// values that equal `undefined` will be removed. Validation issues
		// add too much noise so they get removed as well.
		block = JSON.parse(
			JSON.stringify( omit( block, 'validationIssues' ) )
		);

		// Change client IDs to a predictable value
		block.clientId = '_clientId_' + index;

		// Recurse to normalize inner blocks
		block.innerBlocks = normalizeParsedBlocks( block.innerBlocks );

		return block;
	} );
}

describe( 'full post content fixture', () => {
	beforeAll( () => {
		const blockMetadataFiles = glob.sync(
			'packages/block-library/src/*/block.json'
		);
		const blockDefinitions = fromPairs(
			blockMetadataFiles.map( ( file ) => {
				const { name, ...metadata } = require( file );
				return [ name, metadata ];
			} )
		);
		unstable__bootstrapServerSideBlockDefinitions( blockDefinitions );
		// Load all hooks that modify blocks
		require( '../../../packages/editor/src/hooks' );
		registerCoreBlocks();
		if ( process.env.IS_GUTENBERG_PLUGIN ) {
			__experimentalRegisterExperimentalCoreBlocks( {
				enableFSEBlocks: true,
			} );
		}
	} );

	let spacer = 4;
	if ( prettierConfig?.useTabs ) {
		spacer = '\t';
	} else if ( prettierConfig?.tabWidth ) {
		spacer = prettierConfig?.tabWidth;
	}

	blockBasenames.forEach( ( basename ) => {
		// eslint-disable-next-line jest/valid-title
		it( basename, () => {
			const {
				filename: htmlFixtureFileName,
				file: htmlFixtureContent,
			} = getBlockFixtureHTML( basename );
			if ( htmlFixtureContent === null ) {
				throw new Error(
					`Missing fixture file: ${ htmlFixtureFileName }`
				);
			}

			const {
				filename: parsedJSONFixtureFileName,
				file: parsedJSONFixtureContent,
			} = getBlockFixtureParsedJSON( basename );
			const parserOutputActual = grammarParse( htmlFixtureContent );
			let parserOutputExpectedString;
			if ( parsedJSONFixtureContent ) {
				parserOutputExpectedString = parsedJSONFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				parserOutputExpectedString =
					JSON.stringify( parserOutputActual, null, spacer ) + '\n';
				writeBlockFixtureParsedJSON(
					basename,
					parserOutputExpectedString
				);
			} else {
				throw new Error(
					`Missing fixture file: ${ parsedJSONFixtureFileName }`
				);
			}

			const parserOutputExpected = JSON.parse(
				parserOutputExpectedString
			);
			try {
				expect( parserOutputActual ).toEqual( parserOutputExpected );
			} catch ( err ) {
				throw new Error(
					format(
						"File '%s' does not match expected value:\n\n%s",
						parsedJSONFixtureFileName,
						err.message
					)
				);
			}

			const blocksActual = parse( htmlFixtureContent );

			// Block validation may log errors during deprecation migration,
			// unless explicitly handled from a valid block via isEligible.
			// Match on basename for deprecated blocks fixtures to allow.
			const isDeprecated = /__deprecated([-_]|$)/.test( basename );
			if ( isDeprecated ) {
				/* eslint-disable no-console */
				console.warn.mockReset();
				console.error.mockReset();
				console.info.mockReset();
				/* eslint-enable no-console */
			}

			const blocksActualNormalized = normalizeParsedBlocks(
				blocksActual
			);
			const {
				filename: jsonFixtureFileName,
				file: jsonFixtureContent,
			} = getBlockFixtureJSON( basename );

			let blocksExpectedString;

			if ( jsonFixtureContent ) {
				blocksExpectedString = jsonFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				blocksExpectedString =
					JSON.stringify( blocksActualNormalized, null, spacer ) +
					'\n';
				writeBlockFixtureJSON( basename, blocksExpectedString );
			} else {
				throw new Error(
					`Missing fixture file: ${ jsonFixtureFileName }`
				);
			}

			const blocksExpected = JSON.parse( blocksExpectedString );
			try {
				expect( blocksActualNormalized ).toEqual( blocksExpected );
			} catch ( err ) {
				throw new Error(
					format(
						"File '%s' does not match expected value:\n\n%s",
						jsonFixtureFileName,
						err.message
					)
				);
			}

			// `serialize` doesn't have a trailing newline, but the fixture
			// files should.
			const serializedActual = serialize( blocksActual ) + '\n';
			const {
				filename: serializedHTMLFileName,
				file: serializedHTMLFixtureContent,
			} = getBlockFixtureSerializedHTML( basename );

			let serializedExpected;
			if ( serializedHTMLFixtureContent ) {
				serializedExpected = serializedHTMLFixtureContent;
			} else if ( process.env.GENERATE_MISSING_FIXTURES ) {
				serializedExpected = serializedActual;
				writeBlockFixtureSerializedHTML( basename, serializedExpected );
			} else {
				throw new Error(
					`Missing fixture file: ${ serializedHTMLFileName }`
				);
			}

			try {
				expect( serializedActual ).toEqual( serializedExpected );
			} catch ( err ) {
				throw new Error(
					format(
						"File '%s' does not match expected value:\n\n%s",
						serializedHTMLFileName,
						err.message
					)
				);
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
			.filter(
				( name ) => ! [ 'core/embed', 'core/template' ].includes( name )
			)
			.forEach( ( name ) => {
				const nameToFilename = blockNameToFixtureBasename( name );
				const foundFixtures = blockBasenames
					.filter(
						( basename ) =>
							basename === nameToFilename ||
							startsWith( basename, nameToFilename + '__' )
					)
					.map( ( basename ) => {
						const {
							filename: htmlFixtureFileName,
						} = getBlockFixtureHTML( basename );
						const {
							file: jsonFixtureContent,
						} = getBlockFixtureJSON( basename );
						// The parser output for this test.  For missing files,
						// JSON.parse( null ) === null.
						const parserOutput = JSON.parse( jsonFixtureContent );
						// The name of the first block that this fixture file
						// contains (if any).
						const firstBlock = get(
							parserOutput,
							[ '0', 'name' ],
							null
						);
						return {
							filename: htmlFixtureFileName,
							parserOutput,
							firstBlock,
						};
					} )
					.filter( ( fixture ) => fixture.parserOutput !== null );

				if ( ! foundFixtures.length ) {
					errors.push(
						format(
							"Expected a fixture file called '%s.html' or '%s__*.html' in `test/integration/fixtures/blocks/` " +
								'\n\n' +
								'For more information on how to create test fixtures see https://github.com/WordPress/gutenberg/blob/1f75f8f6f500a20df5b9d6e317b4d72dd5af4ede/test/integration/fixtures/blocks/README.md\n\n',
							nameToFilename,
							nameToFilename
						)
					);
				}

				foundFixtures.forEach( ( fixture ) => {
					if ( name !== fixture.firstBlock ) {
						errors.push(
							format(
								"Expected fixture file '%s' to test the '%s' block.",
								fixture.filename,
								name
							)
						);
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
