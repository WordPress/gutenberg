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

// TypeScript-specific tests for shouldSkipReference.
const tsRuleTester = new RuleTester( {
	parser: require.resolve( '@typescript-eslint/parser' ),
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

tsRuleTester.run( 'no-dom-globals-in-constructor (TypeScript)', rule, {
	valid: [
		{
			// TSTypeReference — type annotation using a DOM global.
			code: `class Foo {
				constructor( el: HTMLElement ) { this.el = el; }
			}`,
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
	],
} );
