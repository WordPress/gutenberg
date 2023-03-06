/**
 * External dependencies
 */
import {
	getEditorHtml,
	initializeEditor,
	setupCoreBlocks,
	transformBlock,
	getBlockTransformOptions,
} from 'test/helpers';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

const block = 'Latest Posts';
const initialHtml = `
<!-- wp:latest-posts {"displayPostContent":true,"displayPostDate":true} /-->`;

const transformsWithInnerBlocks = [ 'Columns', 'Group' ];
const blockTransforms = [ ...transformsWithInnerBlocks ];

setupCoreBlocks();

describe( `${ block } block transforms`, () => {
	beforeAll( () => {
		// Mock response of the request made from Latest Posts block to path "/wp/v2/categories".
		apiFetch.mockResolvedValue( [
			{
				slug: 'uncategorized',
				parent: 0,
				id: 1,
				count: 6,
				link: '',
				meta: [],
				description: '',
				name: 'Uncategorized',
				taxonomy: 'category',
			},
		] );
	} );

	test.each( blockTransforms )( 'to %s block', async ( blockTransform ) => {
		const screen = await initializeEditor( { initialHtml } );
		const newBlock = await transformBlock( screen, block, blockTransform, {
			hasInnerBlocks:
				transformsWithInnerBlocks.includes( blockTransform ),
		} );
		expect( newBlock ).toBeVisible();
		expect( getEditorHtml() ).toMatchSnapshot();
	} );

	it( 'matches expected transformation options', async () => {
		const screen = await initializeEditor( { initialHtml } );
		const transformOptions = await getBlockTransformOptions(
			screen,
			block
		);
		expect( transformOptions ).toHaveLength( blockTransforms.length );
	} );
} );
