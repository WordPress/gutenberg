/**
 * External dependencies
 */
import path from 'path';
import os from 'os';
import { v4 as uuid } from 'uuid';
const childProcess = require( 'child_process' );

/**
 * Internal dependencies
 */
import { showBlockToolbar } from './show-block-toolbar';

const takeScreenshot = async () => {
	const filename = uuid();
	const tmpFileName = path.join( os.tmpdir(), filename + '.png' );
	await page.screenshot( {
		path: tmpFileName,
	} );
	return tmpFileName;
};

const uploadScreenshot = ( filename ) => {
	console.log(
		childProcess
			.execSync(
				'curl --upload-file ' +
					filename +
					' https://transfer.sh/gutenberg.png'
			)
			.toString()
	);
};

/**
 * Converts editor's block type.
 *
 * @param {string} name Block name.
 */
export async function transformBlockTo( name ) {
	await showBlockToolbar();

	const switcherToggle = await page.waitForSelector(
		'.block-editor-block-switcher__toggle'
	);
	await switcherToggle.evaluate( ( element ) => element.scrollIntoView() );
	await page.waitForSelector( '.block-editor-block-switcher__toggle', {
		visible: true,
	} );
	await switcherToggle.click();

	// Find the block button option within the switcher popover.
	const xpath = `//*[contains(@class, "block-editor-block-switcher__popover")]//button[.='${ name }']`;
	const insertButton = ( await page.$x( xpath ) )[ 0 ];

	// Clicks may fail if the button is out of view. Assure it is before click.
	await insertButton.evaluate( ( element ) => element.scrollIntoView() );
	await page.waitForXPath( xpath, { visible: true } );
	const filename = await takeScreenshot();
	await insertButton.click();

	try {
		// Wait for the transformed block to appear.
		const BLOCK_SELECTOR = '.block-editor-block-list__block';
		const BLOCK_NAME_SELECTOR = `[data-title="${ name }"]`;
		await page.waitForSelector(
			`${ BLOCK_SELECTOR }${ BLOCK_NAME_SELECTOR }`
		);
	} catch ( e ) {
		uploadScreenshot( filename );
		throw e;
	}
}
