/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

type Editor = import('@wordpress/e2e-test-utils-playwright').Editor;
type Page = import('@playwright/test').Page;

const TABLE_POST_CONTENT = `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td>anchor</td></tr><tr><td>same</td></tr><tr><td>same</td></tr></tbody></table></figure>
<!-- /wp:table -->`;
const EDITED_SECOND_DUPLICATE = 'edited-second-duplicate';

async function getPersistedContent(
	requestUtils: {
		rest: < T >( options: {
			path: string;
			params?: Record< string, string >;
		} ) => Promise< T >;
	},
	postId: number
): Promise< string > {
	const post = await requestUtils.rest< {
		content: string | { raw?: string; rendered?: string };
	} >( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );

	return typeof post.content === 'string'
		? post.content
		: post.content.raw ?? post.content.rendered ?? '';
}

async function getRevisionContents(
	requestUtils: {
		rest: < T >( options: {
			path: string;
			params?: Record< string, string >;
		} ) => Promise< T >;
	},
	postId: number
): Promise< string[] > {
	const revisions = await requestUtils.rest<
		Array< { content?: string | { raw?: string; rendered?: string } } >
	>( {
		path: `/wp/v2/posts/${ postId }/revisions`,
		params: { context: 'edit' },
	} );

	return revisions.map( ( revision ) => {
		if ( typeof revision.content === 'string' ) {
			return revision.content;
		}

		return revision.content?.raw ?? revision.content?.rendered ?? '';
	} );
}

async function getTableBodyCellContents( editor: Editor ) {
	return editor.canvas
		.getByRole( 'textbox', { name: 'Body cell text' } )
		.evaluateAll( ( cells ) =>
			cells.map( ( cell ) => cell.textContent?.trim() )
		);
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

async function selectTableCellText( {
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
	await page.keyboard.press( 'ControlOrMeta+a' );
}

async function openDeleteRowMenu( {
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
	await expect(
		page.getByRole( 'menuitem', { name: 'Delete row' } )
	).toBeVisible();
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

		await collaborationUtils.openCollaborativeSession( post.id );
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
			editTableCell( {
				content: EDITED_SECOND_DUPLICATE,
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
			.toEqual( [ 'anchor', EDITED_SECOND_DUPLICATE ] );
		await expect
			.poll( () => getTableBodyCellContents( editor2 ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', EDITED_SECOND_DUPLICATE ] );
	} );

	test( 'saves the later duplicate row edit into revisions when another user deletes the earlier duplicate row', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		test.setTimeout( 60_000 );

		const post = await requestUtils.createPost( {
			title: 'Duplicate table row body revision loss',
			status: 'draft',
			content: TABLE_POST_CONTENT,
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
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

		await selectTableCellText( {
			editor,
			index: 2,
			page,
		} );
		await openDeleteRowMenu( {
			editor: editor2,
			index: 1,
			page: page2,
		} );

		await page.keyboard.type( EDITED_SECOND_DUPLICATE );
		await expect
			.poll( () => getTableBodyCellContents( editor ), {
				timeout: 5_000,
			} )
			.toContain( EDITED_SECOND_DUPLICATE );
		await page2.getByRole( 'menuitem', { name: 'Delete row' } ).click();

		await Promise.all( [
			collaborationUtils.waitForSyncCycle( page, 5, {
				timeout: 20_000,
			} ),
			collaborationUtils.waitForSyncCycle( page2, 5, {
				timeout: 20_000,
			} ),
		] );
		await expect
			.poll( () => getTableBodyCellContents( editor ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', EDITED_SECOND_DUPLICATE ] );
		await expect
			.poll( () => getTableBodyCellContents( editor2 ), {
				timeout: 10_000,
			} )
			.toEqual( [ 'anchor', EDITED_SECOND_DUPLICATE ] );

		const editorCellsBeforeSave = await getTableBodyCellContents( editor );
		await editor.saveDraft();

		expect( {
			editorCellsBeforeSave,
			persistedContent: await getPersistedContent(
				requestUtils,
				post.id
			),
			revisionContents: await getRevisionContents(
				requestUtils,
				post.id
			),
		} ).toEqual( {
			editorCellsBeforeSave: expect.arrayContaining( [
				EDITED_SECOND_DUPLICATE,
			] ),
			persistedContent: expect.stringContaining(
				EDITED_SECOND_DUPLICATE
			),
			revisionContents: expect.arrayContaining( [
				expect.stringContaining( EDITED_SECOND_DUPLICATE ),
			] ),
		} );
	} );
} );
