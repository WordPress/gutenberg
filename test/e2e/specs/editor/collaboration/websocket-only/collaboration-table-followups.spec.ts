/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';
import type { UserCredentials } from '../fixtures/collaboration-utils';

const COLLABORATOR: UserCredentials = {
	username: 'table_collaborator',
	email: 'table_collaborator@example.com',
	firstName: 'Table',
	lastName: 'Collaborator',
	password: 'password',
	roles: [ 'editor' ],
};

async function tableCells( editor: Editor ) {
	return editor.canvas.getByRole( 'textbox', { name: 'Body cell text' } );
}

async function typeCell(
	editor: Editor,
	page: Page,
	index: number,
	text: string
) {
	await ( await tableCells( editor ) ).nth( index ).click();
	await page.keyboard.press( 'ControlOrMeta+a' );
	await page.keyboard.type( text );
}

async function clickTableMenuItem( editor: Editor, page: Page, name: string ) {
	await editor.clickBlockToolbarButton( 'Edit table' );
	await page.getByRole( 'menuitem', { name } ).click();
}

async function getVisibleTable( editor: Editor ): Promise< string[][] > {
	return editor.canvas
		.locator( '[data-type="core/table"] tbody tr' )
		.evaluateAll( ( rows ) =>
			rows.map( ( row ) =>
				Array.from( row.querySelectorAll( 'td, th' ) ).map( ( cell ) =>
					( cell.textContent || '' ).trim()
				)
			)
		);
}

async function expectVisibleTables(
	editorA: Editor,
	editorB: Editor,
	expected: string[][]
) {
	await expect
		.poll( () => getVisibleTable( editorA ), { timeout: 15_000 } )
		.toEqual( expected );
	await expect
		.poll( () => getVisibleTable( editorB ), { timeout: 15_000 } )
		.toEqual( expected );
}

function expectSavedTableContent( content: string ) {
	expect( content.match( /<tr>/g ) ).toHaveLength( 2 );
	expect( content ).toContain( '<td>anchor</td><td></td>' );
	expect( content ).toContain( '<td>edited-duplicate</td><td>extra</td>' );
	expect( content ).not.toContain( '<td>same</td>' );
}

function tableContent( rows: string[][] ) {
	const body = rows
		.map(
			( row ) =>
				`<tr>${ row
					.map( ( cell ) => `<td>${ cell }</td>` )
					.join( '' ) }</tr>`
		)
		.join( '' );

	return `<!-- wp:table -->\n<figure class="wp-block-table"><table><tbody>${ body }</tbody></table></figure>\n<!-- /wp:table -->`;
}

test.describe( 'Collaboration - WebSocket table follow-ups', () => {
	// eslint-disable-next-line playwright/expect-expect
	test( 'preserves a remote-edited duplicate table row when another user deletes the earlier duplicate row', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 90_000 );

		await requestUtils.createUser( COLLABORATOR );
		const post = await requestUtils.createPost( {
			title: 'RTC table duplicate row follow-up',
			content: tableContent( [ [ 'anchor' ], [ 'same' ] ] ),
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openPost( post.id );
		const { editor: editor2, page: page2 } =
			await collaborationUtils.joinUser( post.id, COLLABORATOR );
		await collaborationUtils.waitForMutualDiscovery();
		await expectVisibleTables( editor, editor2, [
			[ 'anchor' ],
			[ 'same' ],
		] );

		await ( await tableCells( editor ) ).nth( 1 ).click();
		await clickTableMenuItem( editor, page, 'Insert row after' );
		await typeCell( editor, page, 2, 'same' );
		await collaborationUtils.waitForMutualDiscovery();
		await expectVisibleTables( editor, editor2, [
			[ 'anchor' ],
			[ 'same' ],
			[ 'same' ],
		] );

		await ( await tableCells( editor ) ).nth( 1 ).click();
		await typeCell( editor2, page2, 2, 'edited-duplicate' );
		await ( await tableCells( editor2 ) ).nth( 2 ).click();
		await clickTableMenuItem( editor2, page2, 'Insert column after' );
		await typeCell( editor2, page2, 5, 'extra' );
		await clickTableMenuItem( editor, page, 'Delete row' );
		await collaborationUtils.waitForMutualDiscovery();

		await expectVisibleTables( editor, editor2, [
			[ 'anchor', '' ],
			[ 'edited-duplicate', 'extra' ],
		] );

		await editor2.saveDraft();
		const savedPost = await requestUtils.rest< {
			content: { raw: string };
		} >( {
			path: `/wp/v2/posts/${ post.id }`,
			params: { context: 'edit' },
		} );
		expectSavedTableContent( savedPost.content.raw );

		await page.reload( { waitUntil: 'load' } );
		await collaborationUtils.waitForEntityReadyAndSaveSettled( page );
		await page2.reload( { waitUntil: 'load' } );
		await collaborationUtils.waitForEntityReadyAndSaveSettled( page2 );

		await expectVisibleTables( editor, editor2, [
			[ 'anchor', '' ],
			[ 'edited-duplicate', 'extra' ],
		] );
	} );
} );
