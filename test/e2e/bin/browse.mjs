#!/usr/bin/env node

/**
 * Drives a browser on this checkout's WordPress site, to check a change by
 * hand. `open`, `new-post` and `blocks` are ours and use the e2e test utils;
 * any other command goes to playwright-cli, in the same browser.
 *
 *   npm run browse -- open
 *   npm run browse -- new-post --content '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->'
 *   npm run browse -- press Enter
 *   npm run browse -- blocks
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { Editor, RequestUtils } from '@wordpress/e2e-test-utils-playwright';

const baseURL = process.env.WP_BASE_URL || 'http://localhost:8889';
const workDir = fileURLToPath(
	new URL( '../artifacts/browse', import.meta.url )
);
const profileDir = path.join( workDir, 'profile' );
// One browser per checkout, so parallel worktrees never share one.
const session = `gutenberg-${ createHash( 'sha1' )
	.update( workDir )
	.digest( 'hex' )
	.slice( 0, 8 ) }`;

function playwrightCli( args ) {
	return spawnSync( 'playwright-cli', [ `-s=${ session }`, ...args ], {
		stdio: 'inherit',
	} ).status;
}

// Connects to the browser playwright-cli keeps open, through the port Chrome
// picked itself and wrote to its profile.
async function withPage( callback ) {
	let browser;
	try {
		const port = readFileSync(
			path.join( profileDir, 'DevToolsActivePort' ),
			'utf8'
		).split( '\n' )[ 0 ];
		browser = await chromium.connectOverCDP( `http://127.0.0.1:${ port }` );
	} catch {
		throw new Error( 'No browser open. Run `npm run browse -- open`.' );
	}
	const page = browser.contexts()[ 0 ].pages()[ 0 ];
	try {
		await callback( { page, editor: new Editor( { page } ) } );
	} finally {
		// Only disconnects: the browser stays open for the next command.
		await browser.close();
	}
}

const commands = {
	async open() {
		mkdirSync( workDir, { recursive: true } );
		const config = path.join( workDir, 'cli.config.json' );
		writeFileSync(
			config,
			JSON.stringify( {
				outputDir: workDir,
				browser: {
					userDataDir: profileDir,
					launchOptions: { args: [ '--remote-debugging-port=0' ] },
				},
			} )
		);
		if ( playwrightCli( [ 'open', `--config=${ config }` ] ) !== 0 ) {
			throw new Error( 'playwright-cli could not open the browser.' );
		}
		const requestUtils = await RequestUtils.setup( { baseURL } );
		const { cookies } = await requestUtils.setupRest();
		await withPage( async ( { page } ) => {
			await page.context().addCookies( cookies );
			await page.goto( new URL( 'wp-admin/', baseURL ).href );
		} );
	},
	async 'new-post'( args ) {
		const { values } = parseArgs( {
			args,
			options: { content: { type: 'string' } },
		} );
		// Full URLs only: the e2e utils that navigate need the base URL that
		// Playwright takes when it opens a browser, not when it connects.
		await withPage( async ( { page, editor } ) => {
			await page.goto( new URL( 'wp-admin/post-new.php', baseURL ).href );
			await editor.setPreferences( 'core/edit-post', {
				welcomeGuide: false,
				fullscreenMode: false,
			} );
			if ( values.content ) {
				await editor.setContent( values.content );
			}
		} );
	},
	async blocks() {
		await withPage( async ( { editor } ) => {
			console.log(
				JSON.stringify( await editor.getBlocks(), null, '\t' )
			);
		} );
	},
};

const [ name, ...args ] = process.argv.slice( 2 );
if ( commands[ name ] ) {
	commands[ name ]( args ).catch( ( error ) => {
		console.error( error.message );
		process.exitCode = 1;
	} );
} else {
	process.exitCode = playwrightCli( process.argv.slice( 2 ) );
}
