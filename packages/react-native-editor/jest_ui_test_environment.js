/**
 * Internal dependencies
 */
const { setupEditor } = require( './__device-tests__/pages/editor-page' );
const utils = require( './__device-tests__/helpers/utils' );
const testData = require( './__device-tests__/helpers/test-data' );

/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const JSDOMEnvironment = require( 'jest-environment-jsdom' ).default;

class CustomEnvironment extends JSDOMEnvironment {
	async setup() {
		try {
			await super.setup();
			this.global.editorPage = await setupEditor();
			this.global.e2eUtils = utils;
			this.global.e2eTestData = testData;
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'E2E setup exception:', error );
			throw error; // Re-throw to fail the test.
		}
	}

	async teardown() {
		if ( this.global.editorPage ) {
			await this.global.editorPage.stopDriver();
		}
		await super.teardown();
	}
}

module.exports = CustomEnvironment;
