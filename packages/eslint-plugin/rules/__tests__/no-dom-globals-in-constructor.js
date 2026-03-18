/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-dom-globals-in-constructor';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

ruleTester.run( 'no-dom-globals-in-constructor', rule, {
	valid: [
		{
			code: `class Foo {
				method() { document.title = "test"; }
			}`,
		},
		{
			code: `class Foo {
				constructor() { this.name = "test"; }
			}`,
		},
	],
	invalid: [
		{
			code: `class Foo {
				constructor() { document.title = "test"; }
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'document' },
				},
			],
		},
		{
			code: `class Foo {
				constructor() { window.addEventListener("resize", () => {}); }
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'window' },
				},
			],
		},
	],
} );
