/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../require-valid-since.js';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'require-valid-since', rule, {
	valid: [
		{
			code: `
			/**
			 * @since 1.2.3
			 */
			function test() {}
			`,
		},
		{
			code: `
			/**
			 * @since 2.0.0 Adds support for new feature.
			 */
			const foo = () => {};
			`,
		},
		{
			code: `
			/**
			 * Some other comment
			 * @param {string} name
			 */
			function greet(name) {}
			`,
		},
		{
			code: `
			/**
			 * @since 10.5.99 Additional notes here.
			 */
			class MyClass {}
			`,
		},
	],
	invalid: [
		{
			code: `
			/**
			 * @since 1.2
			 */
			function test() {}
			`,
			errors: [
				{
					message:
						'@since version "1.2" is invalid. Must be valid semver (e.g., 1.2.3).',
				},
			],
		},
		{
			code: `
			/**
			 * @since version 3
			 */
			function foo() {}
			`,
			errors: [
				{
					message:
						'@since version "version" is invalid. Must be valid semver (e.g., 1.2.3).',
				},
			],
		},
		{
			code: `
			/**
			 * @since 6.7.x
			 */
			const bar = () => {};
			`,
			errors: [
				{
					message:
						'@since version "6.7.x" is invalid. Must be valid semver (e.g., 1.2.3).',
				},
			],
		},
		{
			code: `
			/**
			 * @since 3.14
			 */
			class MyClass {}
			`,
			errors: [
				{
					message:
						'@since version "3.14" is invalid. Must be valid semver (e.g., 1.2.3).',
				},
			],
		},
	],
} );
