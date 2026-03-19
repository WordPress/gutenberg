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
		{
			code: `const styles = { '--my-custom-prop': 'value' };`,
		},
		{
			code: `const styles = { color: 'var(--wpds-color-fg-content-neutral)' };`,
		},
		{
			code: `const { '--wpds-color-fg-content-neutral': neutralColor } = styles;`,
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
		{
			code: `const styles = { '--wpds-color-fg-content-neutral': 'red' };`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `function getStyles() { return { '--wpds-font-size-md': '10px' }; }`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `const config = { inner: { '--wpds-color-fg-content-neutral': 'red' } };`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
	],
} );
