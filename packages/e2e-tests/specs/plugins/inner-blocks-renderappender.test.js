/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getAllBlockInserterItemTitles,
	getEditedPostContent,
	insertBlock,
	openAllBlockInserterCategories,
} from '@wordpress/e2e-test-utils';

describe( 'RenderAppender prop of InnerBlocks ', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-renderappender' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-innerblocks-renderappender' );
	} );

	it( 'Users can customize the appender and can still insert blocks using exposed components', async () => {
		await insertBlock( 'InnerBlocks renderAppender' );
		const appenderSelector = '.my-custom-awesome-appender';
		await page.waitForSelector( appenderSelector );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ appenderSelector } > span` )
			)
		).toEqual( 'My custom awesome appender' );
		await page.click( `${ appenderSelector } .block-editor-button-block-appender` );
		await openAllBlockInserterCategories();
		expect(
			await getAllBlockInserterItemTitles()
		).toEqual( [
			'Quote',
			'Video',
		] );
		await page.click( `.block-editor-block-types-list__item[aria-label="Quote"]` );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Users can dynamically customize the appender', async () => {
		await insertBlock( 'InnerBlocks renderAppender dynamic' );
		const dynamicAppenderSelector = '.my-dynamic-blocks-appender';
		await page.waitForSelector( dynamicAppenderSelector );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span` ) )
		).toEqual( 'Empty Blocks Appender' );
		const blockAppenderButtonSelector = `${ dynamicAppenderSelector } .block-editor-button-block-appender`;
		await page.click( blockAppenderButtonSelector );
		await openAllBlockInserterCategories();
		expect(
			await getAllBlockInserterItemTitles()
		).toEqual( [
			'Quote',
			'Video',
		] );
		await page.click( `.block-editor-block-types-list__item[aria-label="Quote"]` );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span` ) )
		).toEqual( 'Single Blocks Appender' );
		expect(
			await page.$( blockAppenderButtonSelector )
		).toBeTruthy();
		await insertBlock( 'Video' );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span` ) )
		).toEqual( 'Multiple Blocks Appender' );
		expect(
			await page.$( blockAppenderButtonSelector )
		).toBeFalsy();
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
