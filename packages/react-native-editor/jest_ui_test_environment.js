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
		this.global.editorPage = await initializeEditorPage();
	}

	async teardown() {
		await this.global.editorPage.stopDriver();
		await super.teardown();
	}
}

module.exports = CustomEnvironment;
