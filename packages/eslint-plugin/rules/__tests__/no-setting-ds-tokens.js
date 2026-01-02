import { RuleTester } from 'eslint';
import rule from '../no-setting-ds-tokens';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-setting-ds-tokens', rule, {
	valid: [
		{
			code: `<div style={ { '--my-custom-prop': 'value' } } />`,
		},
		{
			code: `<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />`,
		},
		{
			code: `<div style={ { '--other-prefix-token': '10px' } } />`,
		},
		{
			code: `<div style={ { margin: '10px' } } />`,
		},
	],
	invalid: [
		{
			code: `<div style={ { '--wpds-color-fg-content-neutral': 'red' } } />`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `<div style={ { '--wpds-font-size-md': '10px', color: 'blue' } } />`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
	],
} );
