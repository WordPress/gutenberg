/**
 * External dependencies
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * WordPress dependencies
 */
import { trashAllPosts, activateTheme } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { siteEditor } from '../../experimental-features';

async function waitForFileExists( filePath, timeout = 10000 ) {
	const start = Date.now();
	while ( ! fs.existsSync( filePath ) ) {
		await delay( 1000 );
		if ( Date.now() - start > timeout ) {
			throw Error( 'waitForFileExists timeout' );
		}
	}
}

function delay( time ) {
	return new Promise( function ( resolve ) {
		setTimeout( resolve, time );
	} );
}

describe( 'Site Editor Templates Export', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	beforeEach( async () => {
		await siteEditor.visit();
	} );

	it( 'clicking export should download edit-site-export.zip file', async () => {
		const directory = fs.mkdtempSync(
			path.join( os.tmpdir(), 'test-edit-site-export-' )
		);
		await page._client.send( 'Page.setDownloadBehavior', {
			behavior: 'allow',
			downloadPath: directory,
		} );

		await siteEditor.clickOnMoreMenuItem( 'Export' );
		const filePath = path.join( directory, 'edit-site-export.zip' );
		await waitForFileExists( filePath );
		expect( fs.existsSync( filePath ) ).toBe( true );
		fs.unlinkSync( filePath );
	} );
} );
