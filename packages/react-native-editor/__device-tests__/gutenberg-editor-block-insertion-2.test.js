/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	headerBlockEmpty,
	listBlockEmpty,
	moreBlockEmpty,
	paragraphBlockEmpty,
	separatorBlockEmpty,
} from './helpers/test-data';

describe( 'Gutenberg Editor tests for Block insertion 2', () => {
	it( 'adds new block at the end of post', async () => {
		await editorPage.addNewBlock( blockNames.heading );

		const headingBlock = await editorPage.getBlockAtPosition(
			blockNames.heading
		);
		expect( headingBlock ).toBeTruthy();

		await editorPage.addNewBlock( blockNames.list );

		const listItemBlock = await editorPage.getBlockAtPosition(
			blockNames.listItem
		);
		expect( listItemBlock ).toBeTruthy();

		const expectedHtml = [ headerBlockEmpty, listBlockEmpty ].join(
			'\n\n'
		);
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts between 2 existing blocks', async () => {
		const firstBlock = await editorPage.getFirstBlockVisible();
		await firstBlock.click();

		await editorPage.addNewBlock( blockNames.separator );

		const separatorBlock = await editorPage.getBlockAtPosition(
			blockNames.separator,
			2
		);
		expect( separatorBlock ).toBeTruthy();

		const expectedHtml = [
			headerBlockEmpty,
			separatorBlockEmpty,
			listBlockEmpty,
		].join( '\n\n' );

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts block at the end of post when no block is selected', async () => {
		await editorPage.addNewBlock( blockNames.more );

		const moreBlock = await editorPage.getBlockAtPosition(
			blockNames.more,
			4
		);
		expect( moreBlock ).toBeTruthy();

		const expectedHtml = [
			headerBlockEmpty,
			separatorBlockEmpty,
			listBlockEmpty,
			moreBlockEmpty,
		].join( '\n\n' );

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'creates a new Paragraph block tapping on the empty area below the last block', async () => {
		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();

		const paragraphBlock = await editorPage.getBlockAtPosition(
			blockNames.paragraph,
			5
		);
		expect( paragraphBlock ).toBeTruthy();

		const expectedHtml = [
			headerBlockEmpty,
			separatorBlockEmpty,
			listBlockEmpty,
			moreBlockEmpty,
			paragraphBlockEmpty,
		].join( '\n\n' );

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );
} );
