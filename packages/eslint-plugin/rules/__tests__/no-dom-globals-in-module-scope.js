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
		ecmaVersion: 2020,
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
		{
			// Function scope in a script file should not be flagged.
			code: 'function foo() { window.scrollTo(0, 0); }',
			parserOptions: { ecmaVersion: 2020, sourceType: 'script' },
		},
		// Shared globals (browser + node) should NOT be flagged.
		{
			code: 'console.log("hello");',
		},
		{
			code: 'setTimeout(() => {}, 100);',
		},
		{
			code: 'const u = new URL("https://example.com");',
		},
		{
			code: 'fetch("/api/data");',
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
		{
			code: 'localStorage.getItem("key");',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'localStorage' },
				},
			],
		},
		{
			code: 'sessionStorage.setItem("key", "value");',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'sessionStorage' },
				},
			],
		},
		{
			code: 'history.pushState({}, "", "/new");',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'history' },
				},
			],
		},
		{
			code: 'location.href = "/";',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'location' },
				},
			],
		},
	],
} );

// TypeScript-specific tests for shouldSkipReference.
const tsRuleTester = new RuleTester( {
	parser: require.resolve( '@typescript-eslint/parser' ),
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

tsRuleTester.run( 'no-dom-globals-in-module-scope (TypeScript)', rule, {
	valid: [
		{
			// TSTypeReference — type annotation using a DOM global.
			code: 'const el: HTMLElement = null as any;',
		},
		{
			// TSInterfaceHeritage — extending a DOM interface.
			code: 'interface MyEl extends HTMLElement {}',
		},
		{
			// TSTypeQuery — typeof in type position.
			code: 'type Win = typeof window;',
		},
		{
			// TSQualifiedName — DOM global as left side of a qualified type name.
			code: 'type DocType = typeof window.document;',
		},
	],
	invalid: [
		{
			// Value-level usage should still be flagged even in TS files.
			code: 'const width = window.innerWidth;',
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'window' },
				},
			],
		},
	],
} );
