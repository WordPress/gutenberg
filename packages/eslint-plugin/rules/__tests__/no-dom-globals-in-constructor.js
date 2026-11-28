import typescriptParser from '@typescript-eslint/parser';
import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../no-dom-globals-in-constructor';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
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
		{
			// Non-React classes may use DOM globals in constructors.
			code: `class Gallery {
				constructor( container ) {
					window.addEventListener( "resize", () => this.reflow() );
				}
				reflow() {}
			}`,
		},
		{
			code: `class Gallery {
				constructor() { document.title = "test"; }
			}`,
		},
	],
	invalid: [
		{
			code: `class Foo extends Component {
				constructor() { document.title = "test"; }
				render() { return null; }
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'document' },
				},
			],
		},
		{
			code: `class Foo extends React.Component {
				constructor() { window.addEventListener("resize", () => {}); }
				render() { return null; }
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'window' },
				},
			],
		},
		{
			code: `class Foo extends PureComponent {
				constructor() { document.title = "test"; }
				render() { return null; }
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'document' },
				},
			],
		},
		{
			// JSX render without extending Component still counts as React CC.
			code: `class Foo {
				constructor() { document.title = "test"; }
				render() { return <div />; }
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

// TypeScript-specific tests for shouldSkipReference.
const tsRuleTester = new RuleTester( {
	languageOptions: {
		parser: typescriptParser,
		ecmaVersion: 2020,
		sourceType: 'module',
		parserOptions: {
			ecmaFeatures: { jsx: true },
		},
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
			// Non-React TS class with DOM access in constructor.
			code: `class Gallery {
				constructor() { document.title = "test"; }
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
			// Value-level usage should still be flagged for React classes.
			code: `class Foo extends Component {
				constructor() { document.title = "test"; }
				render() { return null; }
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
