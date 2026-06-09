/**
 * WordPress dependencies
 */
import type { Page } from '@playwright/test';
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';
import type { UserCredentials } from '../fixtures/collaboration-utils';

const MIN_REQUIRED_WS_DELAY_MS = 30;
const CONFIGURED_WS_DELAY_MS =
	Number.parseInt( process.env.RTC_WS_DELAY || '0', 10 ) || 0;

type EditorBlock = {
	name: string;
	innerBlocks?: EditorBlock[];
};

const THIRD_USER: UserCredentials = {
	username: 'list_template_collaborator',
	email: 'list_template_collaborator@example.com',
	firstName: 'List',
	lastName: 'Collaborator',
	password: 'password',
	roles: [ 'editor' ],
};

async function getListItemCounts( editor: Editor ) {
	const blocks = ( await editor.getBlocks() ) as EditorBlock[];

	return blocks
		.filter( ( block ) => block.name === 'core/list' )
		.map(
			( block ) =>
				( block.innerBlocks ?? [] ).filter(
					( innerBlock ) => innerBlock.name === 'core/list-item'
				).length
		);
}

async function insertListWithSlashInserter( editor: Editor, page: Page ) {
	await editor.canvas
		.locator( 'role=button[name="Add default block"i]' )
		.click();
	await page.keyboard.type( '/list' );
	await expect(
		page.locator( 'role=option[name="List"i][selected]' )
	).toBeVisible();
	await page.keyboard.press( 'Enter' );
}

async function insertListWithSidebarInserter( editor: Editor, page: Page ) {
	await editor.canvas
		.locator( 'role=button[name="Add default block"i]' )
		.click();
	await page.keyboard.type( 'abc' );

	await page.getByLabel( 'Block Inserter' ).click();
	await page
		.getByRole( 'region', { name: 'Block Library' } )
		.getByRole( 'searchbox', { name: 'Search' } )
		.fill( 'List' );
	await page
		.getByRole( 'listbox', { name: 'Blocks' } )
		.getByRole( 'option', { name: 'List', exact: true } )
		.click();
}

test.describe( 'Collaboration - WebSocket List Templates', () => {
	test.skip(
		CONFIGURED_WS_DELAY_MS < MIN_REQUIRED_WS_DELAY_MS,
		`Run with RTC_WS_DELAY=${ MIN_REQUIRED_WS_DELAY_MS } or higher to enable the slow WebSocket reproduction.`
	);

	test( 'inserts the list item template once across peers', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'WebSocket List Template Repro',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		await requestUtils.createUser( THIRD_USER );
		await collaborationUtils.joinUser( post.id, THIRD_USER );
		await collaborationUtils.waitForMutualDiscovery();
		const { editor2 } = collaborationUtils;
		const editor3 = collaborationUtils.getEditor( 1 );

		await insertListWithSlashInserter( editor, page );

		await expect
			.poll( async () => ( await getListItemCounts( editor ) ).length )
			.toBe( 1 );

		await collaborationUtils.waitForConvergence( { timeout: 5000 } );

		expect( await getListItemCounts( editor ) ).toEqual( [ 1 ] );
		expect( await getListItemCounts( editor2 ) ).toEqual( [ 1 ] );
		expect( await getListItemCounts( editor3 ) ).toEqual( [ 1 ] );
	} );

	test( 'inserts the list item template once when the sidebar inserter inserts a list after text', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'WebSocket Sidebar List Template Repro',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		await requestUtils.createUser( THIRD_USER );
		await collaborationUtils.joinUser( post.id, THIRD_USER );
		await collaborationUtils.waitForMutualDiscovery();
		const { editor2 } = collaborationUtils;
		const editor3 = collaborationUtils.getEditor( 1 );

		await insertListWithSidebarInserter( editor, page );

		await expect
			.poll( async () => ( await getListItemCounts( editor ) ).length )
			.toBe( 1 );

		await collaborationUtils.waitForConvergence( { timeout: 5000 } );

		expect( await getListItemCounts( editor ) ).toEqual( [ 1 ] );
		expect( await getListItemCounts( editor2 ) ).toEqual( [ 1 ] );
		expect( await getListItemCounts( editor3 ) ).toEqual( [ 1 ] );
	} );
} );
