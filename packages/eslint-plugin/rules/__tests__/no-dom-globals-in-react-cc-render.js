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
