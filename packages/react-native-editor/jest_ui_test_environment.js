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
		await super.setup();
		try {
			this.global.editorPage = await initializeEditorPage();
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.log( 'Cannot initialize environment: ', error );
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
