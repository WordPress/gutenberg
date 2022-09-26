/**
 * WordPress dependencies
 */
import {
	createNewPost,
	createUser,
	deleteUser,
	getOption,
	insertBlock,
	loginUser,
	pressKeyWithModifier,
	setOption,
} from '@wordpress/e2e-test-utils';

const saveEntities = async () => {
	const savePostSelector = '.editor-post-publish-button__button';
	const savePanelSelector = '.entities-saved-states__panel';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const publishPanelSelector = '.editor-post-publish-panel';
	const closePanelButtonSelector =
		'.editor-post-publish-panel__header-cancel-button button';

	await page.click( savePostSelector );
	await page.waitForSelector( savePanelSelector );
	await page.click( entitiesSaveSelector );
	await page.waitForSelector( publishPanelSelector );
	await page.waitForSelector(
		'.editor-post-publish-panel__header-cancel-button button:not([disabled])'
	);
	await page.click( closePanelButtonSelector );
};

describe( 'Site Title block', () => {
	let originalSiteTitle, password;
	const username = 'testuser';
	beforeAll( async () => {
		originalSiteTitle = await getOption( 'blogname' );
		password = await createUser( username, { role: 'editor' } );
	} );

	afterAll( async () => {
		await deleteUser( username );
		await setOption( 'blogname', originalSiteTitle );
	} );

	it( 'Can edit the site title as admin', async () => {
		await createNewPost();
		await insertBlock( 'Site Title' );
		const editableSiteTitleSelector =
			'[aria-label="Block: Site Title"] a[contenteditable="true"]';
		await page.waitForSelector( editableSiteTitleSelector );
		await page.focus( editableSiteTitleSelector );
		await pressKeyWithModifier( 'primary', 'a' );

		await page.keyboard.type( 'New Site Title' );

		await saveEntities();

		const siteTitle = await getOption( 'blogname' );
		expect( siteTitle ).toEqual( 'New Site Title' );
	} );

	// FIXME: Fix https://github.com/WordPress/gutenberg/issues/33003 and enable this test.
	// I tried adding an `expect( console ).toHaveErroredWith()` as a workaround, but
	// the error occurs only sporadically (e.g. locally in interactive mode, but not in
	// headless mode).
	it.skip( 'Cannot edit the site title as editor', async () => {
		await loginUser( username, password );

		await createNewPost();
		await insertBlock( 'Site Title' );

		const editableSiteTitleSelector = '[aria-label="Block: Site Title"] a';
		await page.waitForSelector( editableSiteTitleSelector );

		const editable = await page.$eval(
			editableSiteTitleSelector,
			( element ) => element.contentEditable
		);
		expect( editable ).toBe( 'inherit' );
	} );
} );
