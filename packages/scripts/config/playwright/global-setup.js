const path = require( 'path' );
const { request } = require( '@playwright/test' );
const { RequestUtils } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * @param {string|undefined} baseURL
 * @param {string|undefined} storageStatePath
 * @return {Promise<void>}
 */
async function setupSite( baseURL, storageStatePath ) {
	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		baseURL,
		storageStatePath,
	} );

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	await requestContext.dispose();
}

/**
 *
 * @param {import('@playwright/test').FullConfig} config
 * @return {Promise<void>}
 */
async function globalSetup( config ) {
	const sites = process.env.WP_BASE_URLS?.split( ',' );
	if ( sites ) {
		await Promise.all(
			sites.map( ( site, index ) =>
				setupSite(
					site,
					path.join(
						process.env.WP_ARTIFACTS_PATH,
						`storage-states/admin-${ index }.json`
					)
				)
			)
		);
		return;
	}

	const { storageState, baseURL } = config.projects[ 0 ].use;
	await setupSite(
		baseURL,
		typeof storageState === 'string' ? storageState : undefined
	);
}

module.exports = globalSetup;
