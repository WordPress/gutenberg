import { request } from '@playwright/test';
import type { FullConfig } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import baseGlobalSetup from './global-setup';

async function globalSetup( config: FullConfig ) {
	await baseGlobalSetup( config );

	const { storageState, baseURL } = config.projects[ 0 ].use;
	const storageStatePath =
		typeof storageState === 'string' ? storageState : undefined;

	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath,
	} );

	await requestUtils.setGutenbergExperiments( [
		'gutenberg-extensible-site-editor',
	] );

	await requestContext.dispose();
}

export default globalSetup;
