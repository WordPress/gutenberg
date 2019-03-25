/**
 * External dependencies
 */
import {
	filter,
	flatMap,
	map,
	mapValues,
	pickBy,
	some,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	getAllBlocks,
	getAvailableBlockTransforms,
	getBlockSetting,
	getEditedPostContent,
	hasBlockSwitcher,
	createNewPost,
	setPostContent,
	selectBlockByClientId,
	transformBlockTo,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	getAvailableBlockFixturesBasenames,
	getBlockFixtureHTML,
	getBlockFixtureParsedJSON,
} from '../fixtures/';
import { EXPECTED_TRANSFORMS } from '../fixtures/block-transforms.js';

/*
* Returns true if the fileBase refers to a fixture of a block
* that should not be handled e.g: because of being deprecated,
* or because of being a block that tests an error state.
*/
const isAnExpectedUnhandledBlock = ( fileBase ) => {
	if ( fileBase.includes( 'deprecated' ) ) {
		return true;
	}
	const { file: fixture } = getBlockFixtureParsedJSON( fileBase );
	const parsedBlockObject = JSON.parse(
		fixture
	)[ 0 ];
	return some(
		[
			null,
			'core/block',
			'core/column',
			'core/freeform',
			'core/text-columns',
			'core/subhead',
			'core/text',
			'unregistered/example',
		],
		( blockName ) => parsedBlockObject.blockName === blockName
	);
};

const setPostContentAndSelectBlock = async ( content ) => {
	await setPostContent( content );
	const blocks = await getAllBlocks();
	const clientId = blocks[ 0 ].clientId;
	await page.click( '.editor-post-title .editor-post-title__block' );
	await selectBlockByClientId( clientId );
};

const getTransformStructureFromFile = async ( fileBase ) => {
	if ( isAnExpectedUnhandledBlock( fileBase ) ) {
		return null;
	}
	const { file: content } = getBlockFixtureHTML( fileBase );
	await setPostContentAndSelectBlock( content );
	const block = ( await getAllBlocks() )[ 0 ];
	const availableTransforms = await getAvailableBlockTransforms();
	const originalBlock = await getBlockSetting( block.name, 'title' );

	return {
		availableTransforms,
		originalBlock,
		content,
	};
};

const getTransformResult = async ( blockContent, transformName ) => {
	await setPostContentAndSelectBlock( blockContent );
	expect( await hasBlockSwitcher() ).toBe( true );
	await transformBlockTo( transformName );
	return getEditedPostContent();
};

// Skipping all the tests when plugins are enabled
// makes sure the tests are not executed, and no unused snapshots errors are thrown.
const maybeDescribe = process.env.POPULAR_PLUGINS ?
	describe :
	describe.skip;

maybeDescribe( 'Block transforms', () => {
	// Todo: Remove the filter as soon as all fixtures are corrected,
	// and its direct usage on the editor does not trigger errors.
	// Currently some fixtures trigger errors (mainly media related)
	// because when loaded in the editor,
	// some requests are triggered that have a 404 response.
	const fileBasenames = filter(
		getAvailableBlockFixturesBasenames(),
		( basename ) => (
			! some(
				[
					'core__image',
					'core__gallery',
					'core__video',
					'core__file',
					'core__media-text',
					'core__audio',
					'core__cover',
				],
				( exclude ) => basename.startsWith( exclude )
			)
		)
	);

	const transformStructure = {};
	beforeAll( async () => {
		await createNewPost();

		for ( const fileBase of fileBasenames ) {
			const structure = await getTransformStructureFromFile(
				fileBase
			);
			if ( ! structure ) {
				continue;
			}
			transformStructure[ fileBase ] = structure;
			await setPostContent( '' );
			await page.click( '.editor-post-title .editor-post-title__block' );
		}
	} );

	it( 'should contain the expected transforms', async () => {
		const transforms = mapValues(
			pickBy(
				transformStructure,
				( { availableTransforms } ) => availableTransforms,
			),
			( { availableTransforms, originalBlock } ) => {
				return { originalBlock, availableTransforms };
			}
		);
		expect(
			transforms
		).toEqual( EXPECTED_TRANSFORMS );
	} );

	describe( 'correctly transform', () => {
		beforeAll( async () => {
			await createNewPost();
		} );

		beforeEach( async () => {
			await setPostContent( '' );
			await page.click( '.editor-post-title .editor-post-title__block' );
		} );

		const testTable = flatMap(
			EXPECTED_TRANSFORMS,
			( { originalBlock, availableTransforms }, fixture ) => (
				map(
					availableTransforms,
					( destinationBlock ) => ( [
						originalBlock,
						fixture,
						destinationBlock,
					] )
				)
			)
		);

		it.each( testTable )(
			'block %s in fixture %s into the %s block',
			async ( originalBlock, fixture, destinationBlock ) => {
				const { content } = transformStructure[ fixture ];
				expect(
					await getTransformResult( content, destinationBlock )
				).toMatchSnapshot();
			}
		);
	} );
} );
