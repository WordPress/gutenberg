/**
 * External dependencies
 */
import {
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
	switchToEditMode,
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

describe( 'Block transforms', () => {
	const fileBasenames = getAvailableBlockFixturesBasenames();

	const transformStructure = {};
	beforeAll( async () => {
		await createNewPost();
		await switchToEditMode();

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
			await switchToEditMode();
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

		// As Group is available as a transform on *all* blocks this would create a lot of
		// tests which would impact on the performance of the e2e test suite.
		// To avoid this, we remove `core/group` from test table for all but 2 block types.
		const testTableWithSomeGroupsFiltered = testTable.filter( ( transform ) => ( transform[ 2 ] !== 'Group' || transform[ 1 ] === 'core__paragraph__align-right' || transform[ 1 ] === 'core__image' ) );

		it.each( testTableWithSomeGroupsFiltered )(
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
