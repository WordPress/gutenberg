#!/usr/bin/env node

/**
 * Drives a browser on this checkout's WordPress site, to check a change by
 * hand. The commands below call the e2e test utils, with each argument read
 * as JSON when it is JSON; any other command goes to playwright-cli, in the
 * same browser.
 *
 *   npm run browse -- open
 *   npm run browse -- new-post
 *   npm run browse -- insert '{"name":"core/heading"}'
 *   npm run browse -- press Enter
 *   npm run browse -- blocks
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
	// A browser we connect to has no base URL, so resolve paths like
	// `wp-admin/post-new.php` against the site, as the test fixture does.
	const baseURL = process.env.WP_BASE_URL || 'http://localhost:8889';
	const goto = page.goto.bind( page );
	page.goto = ( url, options ) =>
		goto( new URL( url, baseURL ).href, options );
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
	const { cookies } = await ( await RequestUtils.setup( {} ) ).setupRest();
	await withHelpers( async ( { page, admin } ) => {
		await page.context().addCookies( cookies );
		await admin.visitAdminPage( '' );
	} );
}

// The e2e test utils worth calling by hand, by command name.
const commands = {
	// WordPress escapes block markup passed to createNewPost as `content`.
	'new-post': async ( { admin, editor }, { content, ...options } = {} ) => {
		await admin.createNewPost( options );
		if ( content ) {
			await editor.setContent( content );
		}
	},
	'edit-post': ( { admin }, postId ) => admin.editPost( postId ),
	'site-editor': ( { admin }, options ) => admin.visitSiteEditor( options ),
	content: ( { editor }, markup ) =>
		markup === undefined
			? editor.getEditedPostContent()
			: editor.setContent( markup ),
	blocks: async ( { editor }, blocks ) => {
		if ( blocks === undefined ) {
			return editor.getBlocks();
		}
		await editor.setContent( '' );
		// Each block goes in after the one inserted before it.
		for ( const block of blocks ) {
			await editor.insertBlock( block );
		}
	},
	insert: ( { editor }, block ) => editor.insertBlock( block ),
	transform: ( { editor }, name ) => editor.transformBlockTo( name ),
	keys: ( { pageUtils }, keys ) => pageUtils.pressKeys( keys ),
	focus: ( { editor } ) => editor.getFocusOwnerLabel(),
	save: ( { editor } ) => editor.saveDraft(),
	publish: ( { editor } ) => editor.publishPost(),
};

// Like curl for the site's REST API, logged in as admin; needs no browser.
async function api( method, restPath, data ) {
	const requestUtils = await RequestUtils.setup( {} );
	return requestUtils.rest( { method, path: restPath, data } );
}

async function run( command, args ) {
	if ( command === 'open' ) {
		return open();
	}
	if ( command === 'api' ) {
		return api( ...args );
	}
	return withHelpers( ( helpers ) =>
		commands[ command ]( helpers, ...args )
	);
}

const [ command, ...args ] = process.argv.slice( 2 );
if ( [ 'open', 'api', ...Object.keys( commands ) ].includes( command ) ) {
	run(
		command,
		args.map( ( arg ) => {
			try {
				return JSON.parse( arg );
			} catch {
				return arg;
			}
		} )
	)
		.then( ( result ) => {
			if ( typeof result === 'string' ) {
				console.log( result );
			} else if ( result !== undefined ) {
				console.log( JSON.stringify( result, null, '\t' ) );
			}
		} )
		.catch( ( error ) => {
			console.error( error.message );
			process.exitCode = 1;
		} );
} else {
	process.exitCode = playwrightCli( process.argv.slice( 2 ) );
}
