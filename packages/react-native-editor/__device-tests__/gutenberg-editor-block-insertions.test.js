/**
 * Internal dependencies
 */
import { blockNames } from './pages/editor-page';

describe( 'Gutenberg Editor tests for Block insertion', () => {
	it( 'adds new block at the end of post', async () => {
		await editorPage.addNewBlock( blockNames.heading );

		await editorPage.addNewBlock( blockNames.list );

		const expectedHtml = `<!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li></li></ul>
<!-- /wp:list -->`;

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts between 2 existing blocks', async () => {
		const headingBlockElement = await editorPage.getBlockAtPosition(
			blockNames.heading
		);

		await headingBlockElement.click();

		await editorPage.addNewBlock( blockNames.separator );

		const expectedHtml = `<!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:list -->
<ul><li></li></ul>
<!-- /wp:list -->`;

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
		await editorPage.driver.sleep( 1000 );
		await editorPage.closePicker();

		const expectedHtml = `<!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:list -->
<ul><li></li></ul>
<!-- /wp:list -->`;

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'inserts block at the end of post when no block is selected', async () => {
		await editorPage.addNewBlock( blockNames.more );

		const expectedHtml = `<!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:list -->
<ul><li></li></ul>
<!-- /wp:list -->

<!-- wp:more -->
<!--more-->
<!-- /wp:more -->`;

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );

	it( 'creates a new Paragraph block tapping on the empty area below the last block', async () => {
		await editorPage.addParagraphBlockByTappingEmptyAreaBelowLastBlock();

		const expectedHtml = `<!-- wp:heading -->
<h2></h2>
<!-- /wp:heading -->

<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:list -->
<ul><li></li></ul>
<!-- /wp:list -->

<!-- wp:more -->
<!--more-->
<!-- /wp:more -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`;

		const html = await editorPage.getHtmlContent();
		expect( html.toLowerCase() ).toBe( expectedHtml );
	} );
} );
 