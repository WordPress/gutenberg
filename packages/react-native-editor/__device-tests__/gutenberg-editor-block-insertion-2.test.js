/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';
import {
	headingExpectedHTML,
	imageExpectedHTML,
	listExpectedHTML,
	moreExpectedHTML,
	paragraphExpectedHTML,
	separatorExpectedHTML,
} from './helpers/test-data';

describe( 'Gutenberg Editor tests for Block insertion 2', () => {
	it( 'adds new block at the end of post', async () => {
		await editorPage.addNewBlock( blockNames.heading );
		await editorPage.addNewBlock( blockNames.list );

		const expectedHtml = `${ headingExpectedHTML }\n\n${ listExpectedHTML }`;
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts between 2 existing blocks', async () => {
		const headingBlockElement = await editorPage.getBlockAtPosition(
			blockNames.heading
		);

		await headingBlockElement.click();
		await editorPage.addNewBlock( blockNames.separator );

		const expectedHtml = `${ headingExpectedHTML }\n\n${ separatorExpectedHTML }\n\n${ listExpectedHTML }`;
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts block before selected block', async () => {
		const separatorBlockElement = await editorPage.getBlockAtPosition(
			blockNames.separator,
			2
		);
		await separatorBlockElement.click();

		await editorPage.addNewBlock( blockNames.image, 'before' );
		await editorPage.closePicker();

		const expectedHtml = `${ headingExpectedHTML }\n\n${ imageExpectedHTML }\n\n${ separatorExpectedHTML }\n\n${ listExpectedHTML }`;
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts block at the end of post when no block is selected', async () => {
		await editorPage.addNewBlock( blockNames.more );

		const expectedHtml = `${ headingExpectedHTML }\n\n${ imageExpectedHTML }\n\n${ separatorExpectedHTML }\n\n${ listExpectedHTML }\n\n${ moreExpectedHTML }`;
		const html = await editorPage.getHtmlContent();

		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'creates a new Paragraph block tapping on the empty area below the last block', async () => {
		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();

		const expectedHtml = `${ headingExpectedHTML }\n\n${ imageExpectedHTML }\n\n${ separatorExpectedHTML }\n\n${ listExpectedHTML }\n\n${ moreExpectedHTML }\n\n${ paragraphExpectedHTML }`;
		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );
} );
