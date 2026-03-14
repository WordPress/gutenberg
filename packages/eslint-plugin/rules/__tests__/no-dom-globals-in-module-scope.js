/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-dom-globals-in-module-scope';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

ruleTester.run( 'no-dom-globals-in-module-scope', rule, {
	valid: [
		{
			code: 'function foo() { window.scrollTo(0, 0); }',
		},
		{
			code: 'if (typeof window !== "undefined") {}',
		},
		{
			code: 'const isClient = typeof document !== "undefined";',
		},
		{
			code: 'function effect() { const el = document.createElement("div"); }',
		},
	],
	invalid: [
		{
			code: 'const width = window.innerWidth;',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'window' },
				},
			],
		},
		{
			code: 'const el = document.createElement("div");',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'document' },
				},
			],
		},
		{
			code: 'navigator.userAgent;',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'navigator' },
				},
			],
		},
	],
} );
