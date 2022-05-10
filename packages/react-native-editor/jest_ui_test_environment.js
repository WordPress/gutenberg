/**
 * Internal dependencies
 */
const {
	initializeEditorPage,
} = require( './__device-tests__/pages/editor-page' );

/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const JSDOMEnvironment = require( 'jest-environment-jsdom' );

class CustomEnvironment extends JSDOMEnvironment {
	async setup() {
		try {
			await super.setup();
			this.global.editorPage = await initializeEditorPage();
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
