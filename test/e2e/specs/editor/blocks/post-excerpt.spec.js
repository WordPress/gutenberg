const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/*
 * Long enough that the excerpt the server generates from it is longer than the
 * highest length the block offers.
 */
const WORDS = Array.from(
	{ length: 150 },
	( _, index ) => `word${ index }`
).join( ' ' );
const CONTENT = `<!-- wp:paragraph --><p>${ WORDS }</p><!-- /wp:paragraph -->`;

/**
 * Reads the words the Excerpt block is displaying.
 *
 * The block shows the untrimmed excerpt while it is selected, so it has to be
 * deselected before the length it renders can be read.
 *
 * @param {Object} editor Editor utils.
 *
 * @return {Promise<string[]>} The displayed words.
 */
async function getDisplayedWords( editor ) {
	const text = await editor.canvas.getByLabel( 'Excerpt text' ).innerText();
	return text.replace( /…\s*$/, '' ).split( /\s+/ ).filter( Boolean );
}

/**
 * Sets the block's "Max number of words" and deselects the block afterwards.
 *
 * @param {Object} editor Editor utils.
 * @param {Object} page   Playwright page.
 * @param {number} length Length to set.
 */
async function setExcerptLength( editor, page, length ) {
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Excerpt' } )
		.click();
	await page
		.getByRole( 'spinbutton', { name: 'Max number of words' } )
		.fill( String( length ) );
	await editor.canvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.first()
		.click();
}

/**
 * Resolves once no post request has been recorded for `quietMs`.
 *
 * @param {string[]} requests          Live array of recorded request URLs.
 * @param {Object}   [options]
 * @param {number}   [options.quietMs] Required idle window, in milliseconds.
 * @param {number}   [options.maxMs]   Overall cap, in milliseconds.
 */
async function waitForRequestsToSettle(
	requests,
	{ quietMs = 1000, maxMs = 10000 } = {}
) {
	const deadline = Date.now() + maxMs;
	let lastCount = requests.length;
	let quietSince = Date.now();

	while ( Date.now() < deadline ) {
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );

		if ( requests.length !== lastCount ) {
			lastCount = requests.length;
			quietSince = Date.now();
		} else if ( Date.now() - quietSince >= quietMs ) {
			return;
		}
	}
}

test.describe( 'Post Excerpt', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'renders the requested length again after another length was used', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: 'Generated excerpt',
				content: CONTENT,
				status: 'publish',
			},
		} );

		await admin.editPost( post.id );
		await editor.insertBlock( { name: 'core/post-excerpt' } );
		await editor.openDocumentSettingsSidebar();

		const postRequests = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'GET' &&
				/\/wp\/v2\/posts\/\d+/.test( request.url() )
			) {
				postRequests.push( request.url() );
			}
		} );

		/*
		 * The second visit to 100 is the interesting one: the excerpt for that
		 * length has already been requested once, so a cache that ignores the
		 * requested length would keep showing the 30 word excerpt.
		 */
		for ( const length of [ 100, 30, 100 ] ) {
			await setExcerptLength( editor, page, length );

			/*
			 * The block trims what it has already loaded while it waits for the
			 * server, so the excerpt is only conclusive once the requests the
			 * length change triggers have come back.
			 */
			await waitForRequestsToSettle( postRequests );

			await expect
				.poll( () => getDisplayedWords( editor ) )
				.toHaveLength( length );
		}
	} );

	test( 'does not request the post again when it has a stored excerpt', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: 'Stored excerpt',
				content: CONTENT,
				excerpt: WORDS,
				status: 'publish',
			},
		} );

		await admin.editPost( post.id );
		await editor.insertBlock( { name: 'core/post-excerpt' } );
		await editor.openDocumentSettingsSidebar();

		const postRequests = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'GET' &&
				/\/wp\/v2\/posts\/\d+/.test( request.url() )
			) {
				postRequests.push( request.url() );
			}
		} );

		for ( const length of [ 100, 30, 60 ] ) {
			await setExcerptLength( editor, page, length );

			await expect
				.poll( () => getDisplayedWords( editor ) )
				.toHaveLength( length );
		}

		await waitForRequestsToSettle( postRequests );

		/*
		 * `excerpt_length` cannot change the response for a post that has a
		 * stored excerpt, so the block reuses the record already loaded.
		 */
		expect( postRequests ).toEqual( [] );
	} );
} );
