/**
 * External dependencies
 */
const { request } = require( '@playwright/test' );

/**
 * WordPress dependencies
 */
const { RequestUtils } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 *
 * @param {import('@playwright/test').FullConfig} config
 * @return {Promise<void>}
 */
async function globalSetup( config ) {
	const { storageState, baseURL } = config.projects[ 0 ].use;
	const storageStatePath =
		typeof storageState === 'string' ? storageState : undefined;

	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath,
	} );

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	await requestContext.dispose();
}

module.exports = globalSetup;
