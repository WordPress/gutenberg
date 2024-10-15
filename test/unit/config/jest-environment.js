/**
 * External dependencies
 */
const JSDOMEnvironment = require( 'jest-environment-jsdom' ).default;

/**
 * Fix "structuredClone is not defined" error in jsdom environment.
 * @see https://github.com/jsdom/jsdom/issues/3363#issuecomment-1575996129
 * @see https://github.com/eslint/eslint/pull/17915
 */
export default class JestEnvironment extends JSDOMEnvironment {
	constructor( ...args ) {
		super( ...args );

		this.global.structuredClone = structuredClone;
	}
}
