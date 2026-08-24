import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const storybookDir = path.resolve( import.meta.dirname, '..' );
const storyId = 'design-system-components-button--default';
const storybookUrl = 'http://127.0.0.1:50240';
/** @type { string[] } */
const failedResponses = [];
/** @type { string[] } */
const pageErrors = [];
let browser;
let server;

try {
	server = await preview( {
		root: storybookDir,
		build: { outDir: path.resolve( storybookDir, 'build' ) },
		preview: { host: '127.0.0.1', port: 50240, strictPort: true },
	} );

	const indexResponse = await fetch( `${ storybookUrl }/index.json` );
	if ( ! indexResponse.ok ) {
		throw new Error(
			`Static Storybook index returned ${ indexResponse.status }.`
		);
	}

	const { entries } = await indexResponse.json();
	if ( entries?.[ storyId ]?.type !== 'story' ) {
		throw new Error( `Static Storybook does not contain ${ storyId }.` );
	}

	browser = await chromium.launch( { headless: true } );
	const page = await browser.newPage();
	page.on( 'pageerror', ( error ) => pageErrors.push( error.message ) );
	page.on( 'response', ( response ) => {
		if ( response.status() >= 400 ) {
			failedResponses.push(
				`${ response.status() } ${ response.url() }`
			);
		}
	} );

	const response = await page.goto(
		`${ storybookUrl }/iframe.html?id=${ storyId }&viewMode=story`,
		{ waitUntil: 'networkidle' }
	);
	if ( ! response?.ok() ) {
		throw new Error(
			`Static Storybook iframe returned ${
				response?.status() ?? 'no response'
			}.`
		);
	}

	await page.waitForFunction(
		() => document.querySelector( '#storybook-root' )?.childNodes.length,
		undefined,
		{ timeout: 15_000 }
	);

	if ( failedResponses.length || pageErrors.length ) {
		throw new Error( [ ...failedResponses, ...pageErrors ].join( '\n' ) );
	}

	console.log( `Rendered ${ storyId } from the static Storybook build.` );
} finally {
	await browser?.close();
	await server?.close();
}
