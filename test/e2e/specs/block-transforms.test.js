/**
 * External dependencies
 */
import path from 'path';
import { mapValues, pickBy, some } from 'lodash';

/**
 * Internal dependencies
 */
import {
	getAllBlocks,
	getAvailableBlockTransforms,
	getBlockTitle,
	getEditedPostContent,
	hasBlockSwitcher,
	newPost,
	setPostContent,
	selectBlockByClientId,
	transformBlock,
} from '../support/utils';
import {
	getFileBaseNames,
	readFixtureFile,
} from '../../support/utils';
import { EXPECTED_TRANSFORMS } from './fixtures/block-transforms';

const isAnExpectedUnhandledBlock = ( fixturesDir, fileBase ) => {
	if ( fileBase.includes( 'deprecated' ) ) {
		return true;
	}
	const parsedBlockObject = JSON.parse(
		readFixtureFile( fixturesDir, fileBase + '.parsed.json' )
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

const getTransformStructureFromFile = async ( fixturesDir, fileBase ) => {
	if ( isAnExpectedUnhandledBlock( fixturesDir, fileBase ) ) {
		return {
			expectedUnhandledBlock: true,
		};
	}
	const content = readFixtureFile( fixturesDir, fileBase + '.html' );
	await setPostContentAndSelectBlock( content );
	const block = ( await getAllBlocks() )[ 0 ];
	const availableTransforms = await getAvailableBlockTransforms();
	const originalBlock = await getBlockTitle( block.name );

	return {
		availableTransforms,
		originalBlock,
		content,
	};
};

const getTransformResult = async ( blockContent, transformName ) => {
	await setPostContentAndSelectBlock( blockContent );
	expect( await hasBlockSwitcher() ).toBe( true );
	await transformBlock( transformName );
	return getEditedPostContent();
};

describe( 'test transforms', () => {
	const fixturesDir = path.join(
		__dirname, '..', '..', 'integration', 'full-content', 'fixtures'
	);

	const fileBasenames = getFileBaseNames( fixturesDir );

	const transformStructure = {};
	beforeAll( async () => {
		await newPost();

		for ( const fileBase of fileBasenames ) {
			transformStructure[ fileBase ] = await getTransformStructureFromFile(
				fixturesDir,
				fileBase
			);
			await setPostContent( '' );
			await page.click( '.editor-post-title .editor-post-title__block' );
		}
	} );

	it( 'should contain the expected transforms', async () => {
		expect(
			mapValues(
				pickBy(
					transformStructure,
					( { availableTransforms } ) => availableTransforms,
				),
				( { availableTransforms, originalBlock } ) => {
					return { originalBlock, availableTransforms };
				}
			)
		).toEqual( EXPECTED_TRANSFORMS );
	} );

	describe( 'individual transforms work as expected', () => {
		beforeAll( async () => {
			await newPost();
		} );

		beforeEach( async () => {
			await setPostContent( '' );
			await page.click( '.editor-post-title .editor-post-title__block' );
		} );

		for ( const [ fixture, { originalBlock, availableTransforms } ] of Object.entries( EXPECTED_TRANSFORMS ) ) {
			for ( const transform of availableTransforms ) {
				it( `${ originalBlock } block should transform to ${ transform } block. fixture: ${ fixture }`,
					async () => {
						const { content } = transformStructure[ fixture ];
						expect(
							await getTransformResult( content, transform )
						).toMatchSnapshot();
					}
				);
			}
		}
	} );
} );
