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

const QUOTE_INSERT_BUTTON_SELECTOR = '//button[contains(concat(" ", @class, " "), " block-editor-block-types-list__item ")][./span[contains(text(),"Quote")]]';

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
		const quoteButton = ( await page.$x( QUOTE_INSERT_BUTTON_SELECTOR ) )[ 0 ];
		await quoteButton.click();
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Users can dynamically customize the appender', async () => {
		await insertBlock( 'InnerBlocks renderAppender dynamic' );
		const dynamicAppenderSelector = '.my-dynamic-blocks-appender';
		await page.waitForSelector( dynamicAppenderSelector );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span.empty-blocks-appender` ) )
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
		const quoteButton = ( await page.$x( QUOTE_INSERT_BUTTON_SELECTOR ) )[ 0 ];
		await quoteButton.click();
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span.single-blocks-appender` ) )
		).toEqual( 'Single Blocks Appender' );
		expect(
			await page.$( blockAppenderButtonSelector )
		).toBeTruthy();
		await insertBlock( 'Video' );
		expect(
			await page.evaluate(
				( el ) => ( el.innerText ),
				await page.$( `${ dynamicAppenderSelector } > span.multiple-blocks-appender` ) )
		).toEqual( 'Multiple Blocks Appender' );
		expect(
			await page.$( blockAppenderButtonSelector )
		).toBeFalsy();
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
