/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

type Editor = import('@wordpress/e2e-test-utils-playwright').Editor;
type Page = import('@playwright/test').Page;

const TABLE_POST_CONTENT = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>anchor</td></tr><tr><td>same</td></tr><tr><td>same</td></tr></tbody></table></figure>
<!-- /wp:table -->`;

async function getTableBodyCellContents( editor: Editor ) {
	return editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.evaluateAll( ( cells ) =>
			cells.map( ( cell ) => cell.textContent?.trim() )
		);
}

async function waitForTableRowSyncIds( page: Page ) {
	await page.waitForFunction( () => {
		const blocks = window.wp?.data
			?.select( 'core/block-editor' )
			.getBlocks();
		const table = blocks?.find(
			( block: { name: string } ) => block.name === 'core/table'
		);
		const rows = table?.attributes?.body;

		return (
			Array.isArray( rows ) &&
			rows.length === 3 &&
			rows.every( ( row ) =>
				Object.getOwnPropertySymbols( row ).some(
					( symbol ) => symbol.description === 'wpSyncArrayElementId'
				)
			)
		);
	} );
}

async function editTableCell( {
	editor,
	page,
	index,
	content,
}: {
	editor: Editor;
	page: Page;
	index: number;
	content: string;
} ) {
	await editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.nth( index )
		.click();
	await page.keyboard.press( 'ControlOrMeta+a' );
	await page.keyboard.type( content );
}

async function deleteTableRow( {
	editor,
	page,
	index,
}: {
	editor: Editor;
	page: Page;
	index: number;
} ) {
	await editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.nth( index )
		.click();
	await editor.clickBlockToolbarButton( 'Edit table' );
	await page.getByRole( 'menuitem', { name: 'Delete row' } ).click();
}

test.describe( 'Collaboration - duplicate table rows', () => {
	test( 'preserves a later duplicate row edit when the earlier duplicate row is deleted', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		test.setTimeout( 45_000 );

		const post = await requestUtils.createPost( {
			title: 'Duplicate table row collaboration repro',
			status: 'draft',
			content: TABLE_POST_CONTENT,
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openPost( post.id );
		await expect
			.poll( () => getTableBodyCellContents( editor ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', 'same', 'same' ] );
		await collaborationUtils.waitForEntityReadyAndSaveSettled( page );
		await expect
			.poll( () => collaborationUtils.getCrdtDocument( page ), {
				timeout: 10_000,
			} )
			.not.toBeNull();
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		await collaborationUtils.waitForMutualDiscovery();
		const { editor2, page2 } = collaborationUtils;

		await expect
			.poll( () => getTableBodyCellContents( editor ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', 'same', 'same' ] );
		await expect
			.poll( () => getTableBodyCellContents( editor2 ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', 'same', 'same' ] );
		await Promise.all( [
			waitForTableRowSyncIds( page ),
			waitForTableRowSyncIds( page2 ),
		] );

		await Promise.all( [
			editTableCell( {
				content: 'edited-second-duplicate',
				editor,
				index: 2,
				page,
			} ),
			deleteTableRow( {
				editor: editor2,
				index: 1,
				page: page2,
			} ),
		] );

		await Promise.all( [
			collaborationUtils.waitForSyncCycle( page, 5 ),
			collaborationUtils.waitForSyncCycle( page2, 5 ),
		] );

		await expect
			.poll( () => getTableBodyCellContents( editor ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', 'edited-second-duplicate' ] );
		await expect
			.poll( () => getTableBodyCellContents( editor2 ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', 'edited-second-duplicate' ] );
	} );
} );
