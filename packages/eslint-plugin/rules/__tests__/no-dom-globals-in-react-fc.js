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
		ecmaVersion: 6,
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
	],
} );
