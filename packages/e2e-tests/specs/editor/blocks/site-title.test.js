/**
 * WordPress dependencies
 */
import {
	createNewPost,
	createUser,
	deleteUser,
	insertBlock,
	loginUser,
	pressKeyWithModifier,
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

async function getOption( setting ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options.php' );

	const value = await page.$eval(
		`#${ setting }`,
		( element ) => element.value
	);
	await switchUserToTest();
	return value;
}

async function setOption( setting, value ) {
	await switchUserToAdmin();
	await visitAdminPage( 'options-general.php' );

	await page.fill( `#${ setting }`, value );

	await Promise.all( [
		page.click( '#submit' ),
		page.waitForNavigation( { waitUntil: 'networkidle' } ),
	] );

	await switchUserToTest();
}

const saveEntities = async () => {
	await page.click( 'button:text-is("Publish")' );
	await Promise.all( [
		page.waitForResponse( /settings/ ),
		page.click( 'button:text-is("Save")' ),
	] );
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

		await page.click( '[aria-label="Site title text"]' );
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
