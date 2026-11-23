import path from 'node:path';
import { chromium } from 'playwright';
import { preview } from 'vite';

const storybookDir = path.resolve( import.meta.dirname, '..' );
const storybookUrl = 'http://127.0.0.1:50240';
const maxConcurrentStories = 4;
const storyTimeout = 15_000;
/** @type {import('playwright').Browser | undefined} */
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

	/**
	 * @type {{ entries: Record<string, { id: string, type: string, tags?: string[] }> }}
	 */
	const { entries } = await indexResponse.json();
	const stories = Object.values( entries ).filter(
		( entry ) => entry.type === 'story' && entry.tags?.includes( 'test' )
	);
	if ( ! stories.length ) {
		throw new Error(
			'Static Storybook does not contain testable stories.'
		);
	}

	const launchedBrowser = await chromium.launch( { headless: true } );
	browser = launchedBrowser;
	/** @type {string[]} */
	const failures = [];
	let nextStoryIndex = 0;
	let renderedStories = 0;
	const workerCount = Math.min( maxConcurrentStories, stories.length );

	await Promise.all(
		Array.from( { length: workerCount }, async () => {
			const context = await launchedBrowser.newContext();

			try {
				while ( nextStoryIndex < stories.length ) {
					const story = stories[ nextStoryIndex++ ];

					try {
						await renderStory( context, story.id );
					} catch ( error ) {
						failures.push(
							`${ story.id }: ${
								error instanceof Error
									? error.message
									: String( error )
							}`
						);
					}

					renderedStories++;
					if ( renderedStories % 50 === 0 ) {
						console.log(
							`Rendered ${ renderedStories }/${ stories.length } static stories.`
						);
					}
				}
			} finally {
				await context.close();
			}
		} )
	);

	if ( failures.length ) {
		throw new Error(
			`Static Storybook failed to render ${
				failures.length
			} stories:\n${ failures.join( '\n' ) }`
		);
	}

	console.log(
		`Rendered all ${ stories.length } testable stories from the static Storybook build.`
	);
} finally {
	await browser?.close();
	await server?.close();
}

/**
 * Renders a story with requests to other hosts blocked, so a third-party
 * outage or rate limit cannot fail the smoke test. A story fails when it makes
 * such a request.
 *
 * @param {import('playwright').BrowserContext} context
 * @param {string}                              storyId
 */
async function renderStory( context, storyId ) {
	const page = await context.newPage();
	/** @type {string[]} */
	const failedResponses = [];
	/** @type {string[]} */
	const pageErrors = [];

	page.on( 'pageerror', ( error ) => pageErrors.push( error.message ) );
	page.on( 'response', ( response ) => {
		if ( response.status() >= 400 ) {
			failedResponses.push(
				`${ response.status() } ${ response.url() }`
			);
		}
	} );

	await page.route(
		( url ) =>
			[ 'http:', 'https:' ].includes( url.protocol ) &&
			url.origin !== storybookUrl,
		( route ) => {
			failedResponses.push(
				`External request: ${ route.request().url() }`
			);
			return route.abort( 'blockedbyclient' );
		}
	);

	try {
		const response = await page.goto(
			`${ storybookUrl }/iframe.html?id=${ encodeURIComponent(
				storyId
			) }&viewMode=story`,
			{ waitUntil: 'domcontentloaded' }
		);
		if ( ! response?.ok() ) {
			throw new Error(
				`Iframe returned ${ response?.status() ?? 'no response' }.`
			);
		}

		const storyResult = await page.waitForFunction(
			/** @param {string} expectedStoryId */
			( expectedStoryId ) => {
				const channel =
					/** @type {{ last: (eventName: string) => [{ storyId?: string, status?: string }] | undefined } | undefined} */ (
						// @ts-expect-error Storybook exposes its channel on the preview global.
						globalThis.__STORYBOOK_ADDONS_CHANNEL__
					);
				const result = channel?.last( 'storyFinished' )?.[ 0 ];

				if ( result?.storyId !== expectedStoryId ) {
					return false;
				}

				return { status: result.status };
			},
			storyId,
			{ timeout: storyTimeout }
		);
		const storyResultValue = await storyResult.jsonValue();
		const status = storyResultValue && storyResultValue.status;

		if ( status !== 'success' ) {
			throw new Error( 'Storybook reported a test failure.' );
		}
		if ( failedResponses.length || pageErrors.length ) {
			throw new Error(
				[ ...failedResponses, ...pageErrors ].join( '\n' )
			);
		}
	} finally {
		await page.close();
	}
}
