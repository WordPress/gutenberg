/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
	searchForBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Block variations', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-variations' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-block-variations' );
	} );

	const expectInserterItem = async (
		blockName,
		blockTitle,
		variationName = null
	) => {
		const inserterItemSelector = [
			'.editor-block-list-item',
			blockName.replace( 'core/', '' ),
			variationName,
		]
			.filter( Boolean )
			.join( '-' );
		const inserterItem = await page.$( inserterItemSelector );
		expect( inserterItem ).toBeDefined();
		expect(
			await inserterItem.$x( `//span[text()="${ blockTitle }"]` )
		).toHaveLength( 1 );
	};

	test( 'Search for the overriden default Quote block', async () => {
		await searchForBlock( 'Quote' );

		expect( await page.$( '.editor-block-list-item-quote' ) ).toBeNull();
		expectInserterItem( 'quote', 'Large Quote', 'large' );
	} );

	test( 'Insert the overriden default Quote block variation', async () => {
		await insertBlock( 'Large Quote' );

		expect(
			await page.$(
				'.wp-block[data-type="core/quote"] blockquote.is-style-large'
			)
		).toBeDefined();
	} );

	test( 'Search for the Paragraph block with 2 additioanl variations', async () => {
		await searchForBlock( 'Paragraph' );

		expectInserterItem( 'core/paragraph', 'Paragraph' );
		expectInserterItem( 'core/paragraph', 'Success Message', 'success' );
		expectInserterItem( 'core/paragraph', 'Warning Message', 'warning' );
	} );

	test( 'Insert the Success Message block variation', async () => {
		await insertBlock( 'Success Message' );

		const successMessageBlock = await page.$(
			'.wp-block[data-type="core/paragraph"]'
		);
		expect( successMessageBlock ).toBeDefined();
		expect(
			await successMessageBlock.evaluate( ( node ) => node.innerText )
		).toBe( 'This is a success message!' );
	} );
	test( 'Pick the additional variation in the inserted Columns block', async () => {
		await insertBlock( 'Columns' );

		const fourColumnsVariation = await page.waitForSelector(
			'.wp-block[data-type="core/columns"] .block-editor-block-variation-picker__variation[aria-label="Four columns"]'
		);
		await fourColumnsVariation.click();
		expect(
			await page.$$(
				'.wp-block[data-type="core/columns"] .wp-block[data-type="core/column"]'
			)
		).toHaveLength( 4 );
	} );
} );
