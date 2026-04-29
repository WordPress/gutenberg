/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const ONE_COLUMN_TABLE = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td></td></tr><tr><td></td></tr></tbody></table></figure>
<!-- /wp:table -->`;

const TWO_COLUMN_TABLE = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>A1</td><td>B1</td></tr><tr><td>A2</td><td>B2</td></tr></tbody></table></figure>
<!-- /wp:table -->`;

async function getBodyCellTexts( editor: any ): Promise< string[] > {
	const texts = await editor.canvas
		.locator( 'role=textbox[name="Body cell text"i]' )
		.allTextContents();
	return texts.map( ( text: string ) => text.replace( /\uFEFF/g, '' ) );
}

async function typeInBodyCell(
	page: any,
	editor: any,
	index: number,
	text: string
) {
	const cell = editor.canvas
		.locator( 'role=textbox[name="Body cell text"i]' )
		.nth( index );
	await cell.click();
	await page.keyboard.type( text );
}

async function replaceHtmlModeText( editor: any, text: string ) {
	const htmlEditor = editor.canvas.locator(
		'textarea.block-editor-block-list__block-html-textarea'
	);
	await htmlEditor.click();
	await htmlEditor.fill( text );
}

test.describe( 'Collaboration - table stale snapshots', () => {
	test( 'preserves a remotely inserted table row when another user edits a stale HTML snapshot', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'RTC table stale HTML snapshot',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: TWO_COLUMN_TABLE,
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2, editor2 } = collaborationUtils;

		await expect
			.poll( () => getBodyCellTexts( editor ), { timeout: 10_000 } )
			.toEqual( [ 'A1', 'B1', 'A2', 'B2' ] );
		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 10_000 } )
			.toEqual( [ 'A1', 'B1', 'A2', 'B2' ] );

		await editor.canvas
			.locator( 'role=textbox[name="Body cell text"i]' )
			.nth( 0 )
			.click();
		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );
		const userAHtml = editor.canvas.locator(
			'textarea.block-editor-block-list__block-html-textarea'
		);
		await expect( userAHtml ).toHaveValue( /A1/ );

		await editor2.canvas
			.locator( 'role=textbox[name="Body cell text"i]' )
			.nth( 0 )
			.click();
		await editor2.clickBlockToolbarButton( 'Edit table' );
		await page2
			.getByRole( 'menuitem', { name: 'Insert row after' } )
			.click();
		await typeInBodyCell( page2, editor2, 2, 'A-new' );
		await typeInBodyCell( page2, editor2, 3, 'B-new' );

		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 10_000 } )
			.toEqual( [ 'A1', 'B1', 'A-new', 'B-new', 'A2', 'B2' ] );

		const staleHtml = await userAHtml.inputValue();
		await replaceHtmlModeText(
			editor,
			staleHtml.replace( 'A1', 'A1 local HTML edit' )
		);
		await expect( userAHtml ).toHaveValue( /A1 local HTML edit/ );
		await editor.clickBlockOptionsMenuItem( 'Edit visually' );

		const expectedCells = [
			'A1 local HTML edit',
			'B1',
			'A-new',
			'B-new',
			'A2',
			'B2',
		];

		await expect
			.poll( () => getBodyCellTexts( editor ), { timeout: 15_000 } )
			.toEqual( expectedCells );
		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 15_000 } )
			.toEqual( expectedCells );
	} );

	test( 'preserves a remotely appended table row when another user edits a different cell', async ( {
		collaborationUtils,
		requestUtils,
		page,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'RTC table stale append',
			status: 'draft',
			date_gmt: new Date().toISOString(),
			content: ONE_COLUMN_TABLE,
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2, editor2 } = collaborationUtils;

		await expect
			.poll( () => getBodyCellTexts( editor ), { timeout: 10_000 } )
			.toEqual( [ '', '' ] );
		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 10_000 } )
			.toEqual( [ '', '' ] );

		const userAReceivesSync = page.waitForResponse(
			( response ) =>
				response.url().includes( 'wp-sync' ) &&
				response.status() === 200,
			{ timeout: 15_000 }
		);

		await editor2.canvas
			.locator( 'role=textbox[name="Body cell text"i]' )
			.nth( 1 )
			.click();
		await editor2.clickBlockToolbarButton( 'Edit table' );
		await page2
			.getByRole( 'menuitem', { name: 'Insert row after' } )
			.click();

		await userAReceivesSync;
		await typeInBodyCell( page, editor, 0, 'local-A1' );

		await expect
			.poll( () => getBodyCellTexts( editor ), { timeout: 15_000 } )
			.toEqual( [ 'local-A1', '', '' ] );
		await expect
			.poll( () => getBodyCellTexts( editor2 ), { timeout: 15_000 } )
			.toEqual( [ 'local-A1', '', '' ] );
	} );
} );
