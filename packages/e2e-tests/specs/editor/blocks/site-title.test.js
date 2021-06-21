/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	pressKeyWithModifier,
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

async function getSetting( setting ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options-general.php' );

	const value = await page.$eval(
		`#${ setting }`,
		( element ) => element.value
	);
	await switchUserToTest();
	return value;
}

async function setSetting( setting, value ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options-general.php' );

	await page.focus( `#${ setting }` );
	await pressKeyWithModifier( 'primary', 'a' );
	await page.type( `#${ setting }`, value );

	await Promise.all( [
		page.click( '#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle0' } ),
	] );

	await switchUserToTest();
}

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
	await page.click( closePanelButtonSelector );
};

describe( 'Site Title block', () => {
	let originalSiteTitle;
	beforeAll( async () => {
		originalSiteTitle = await getSetting( 'blogname' );
	} );

	afterAll( async () => {
		await setSetting( 'blogname', originalSiteTitle );
	} );

	it( 'Can edit the site title', async () => {
		await createNewPost();
		await insertBlock( 'Site Title' );
		const editableSiteTitleSelector =
			'.wp-block-site-title a[contenteditable="true"]';
		await page.waitForSelector( editableSiteTitleSelector );
		await page.focus( editableSiteTitleSelector );
		await pressKeyWithModifier( 'primary', 'a' );

		// Create a second list item.
		await page.keyboard.type( 'New Site Title' );

		await saveEntities();

		await page.reload();
		const siteTitle = await getSetting( 'blogname' );
		expect( siteTitle ).toEqual( 'New Site Title' );
	} );
} );
