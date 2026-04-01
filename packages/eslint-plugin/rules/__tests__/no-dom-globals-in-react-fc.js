/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-dom-globals-in-react-fc';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		ecmaFeatures: { jsx: true },
	},
} );

ruleTester.run( 'no-dom-globals-in-react-fc', rule, {
	valid: [
		{
			code: 'function notAComponent() { window.scrollTo(0, 0); }',
		},
		{
			code: 'function Component() { return <div />; }',
		},
		{
			code: `function Component() {
				useEffect(() => { window.scrollTo(0, 0); });
				return <div />;
			}`,
		},
		{
			// DOM global inside a nested callback (event handler) inside FC
			// is allowed — the handler runs at event time, not render time.
			code: `function Component() {
				const onClick = () => { document.title = "clicked"; };
				return <button onClick={onClick} />;
			}`,
		},
	],
	invalid: [
		{
			code: `function Component() {
				window.addEventListener("resize", () => {});
				return <div />;
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'window' },
				},
			],
		},
		{
			code: `const Header = () => {
				const w = document.body.clientWidth;
				return <header>{w}</header>;
			}`,
			errors: [
				{
					messageId: 'defaultMessage',
					data: { name: 'document' },
				},
			],
		},
		{
			code: `const Icon = ( { name } ) => <span className={ window.iconPrefix + name } />;`,
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

tsRuleTester.run( 'no-dom-globals-in-react-fc (TypeScript)', rule, {
	valid: [
		{
			// TSTypeReference — type annotation using a DOM global.
			code: `function Component( { el }: { el: HTMLElement } ) {
				return <div />;
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
			code: `function Component() {
				const w = window.innerWidth;
				return <div>{w}</div>;
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
