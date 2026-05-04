/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

const ONE_COLUMN_TABLE = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td></td></tr><tr><td></td></tr></tbody></table></figure>
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

test.describe( 'Collaboration - table stale snapshots', () => {
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
