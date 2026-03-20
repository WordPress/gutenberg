/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-dom-globals-in-react-cc-render';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

ruleTester.run( 'no-dom-globals-in-react-cc-render', rule, {
	valid: [
		{
			code: `class Foo {
				render() { const x = 1; return <div>{x}</div>; }
			}`,
		},
		{
			code: `class Foo {
				componentDidMount() { window.scrollTo(0, 0); }
				render() { return <div />; }
			}`,
		},
		{
			code: `class Foo {
				render() { return "not jsx"; }
			}`,
		},
	],
	invalid: [
		{
			code: `class Foo {
				render() { const w = window.innerWidth; return <div>{w}</div>; }
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

tsRuleTester.run( 'no-dom-globals-in-react-cc-render (TypeScript)', rule, {
	valid: [
		{
			// TSTypeReference — type annotation using a DOM global.
			code: `class Foo {
				render() { const el: HTMLElement = this.ref; return <div />; }
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
				render() { const w = window.innerWidth; return <div>{w}</div>; }
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
