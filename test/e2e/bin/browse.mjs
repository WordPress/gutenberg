#!/usr/bin/env node

/**
 * Drives a browser on this checkout's WordPress site, to check a change by
 * hand. `open` starts it; `<helper>.<method> [args]` calls an e2e test util
 * (admin, editor, pageUtils or requestUtils), with each argument read as JSON
 * when it is JSON; any other command goes to playwright-cli, in the same
 * browser.
 *
 *   npm run browse -- open
 *   npm run browse -- admin.createNewPost
 *   npm run browse -- editor.insertBlock '{"name":"core/paragraph"}'
 *   npm run browse -- press Enter
 *   npm run browse -- editor.getBlocks
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import {
	Admin,
	Editor,
	PageUtils,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

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

async function loggedInRequestUtils() {
	const requestUtils = await RequestUtils.setup( {} );
	await requestUtils.setupRest();
	return requestUtils;
}

// Connects to the browser playwright-cli keeps open, through the port Chrome
// picked itself and wrote to its profile.
async function withHelpers( callback ) {
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
		const pageUtils = new PageUtils( { page, browserName: 'chromium' } );
		const editor = new Editor( { page } );
		return await callback( {
			page,
			pageUtils,
			editor,
			admin: new Admin( { page, pageUtils, editor } ),
		} );
	} finally {
		// Only disconnects: the browser stays open for the next command.
		await browser.close();
	}
}

async function open() {
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
	const { cookies } = await (
		await loggedInRequestUtils()
	).request.storageState();
	await withHelpers( async ( { page, admin } ) => {
		await page.context().addCookies( cookies );
		await admin.visitAdminPage( '' );
	} );
}

async function callHelper( helperName, methodName, args ) {
	const result = await withHelpers( async ( helpers ) => {
		const helper =
			helperName === 'requestUtils'
				? await loggedInRequestUtils()
				: helpers[ helperName ];
		if ( typeof helper?.[ methodName ] !== 'function' ) {
			throw new Error(
				`No helper ${ helperName }.${ methodName }. See packages/e2e-test-utils-playwright/src.`
			);
		}
		return helper[ methodName ](
			...args.map( ( arg ) => {
				try {
					return JSON.parse( arg );
				} catch {
					return arg;
				}
			} )
		);
	} );
	if ( result !== undefined ) {
		console.log( JSON.stringify( result, null, '\t' ) );
	}
}

const [ command, ...args ] = process.argv.slice( 2 );
const [ helperName, methodName ] = command?.split( '.' ) ?? [];
if ( command === 'open' || methodName ) {
	( command === 'open'
		? open()
		: callHelper( helperName, methodName, args )
	).catch( ( error ) => {
		console.error( error.message );
		process.exitCode = 1;
	} );
} else {
	process.exitCode = playwrightCli( process.argv.slice( 2 ) );
}
