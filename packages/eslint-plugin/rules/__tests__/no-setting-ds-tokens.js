import { RuleTester } from 'eslint';
import rule from '../no-setting-ds-tokens';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
} );

ruleTester.run( 'no-setting-ds-tokens', rule, {
	valid: [
		{
			code: `<div style={ { '--my-custom-prop': 'value' } } />`,
		},
		{
			code: `<div style={ { color: 'var(--wpds-color-foreground-content-neutral)' } } />`,
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
			code: `const styles = { color: 'var(--wpds-color-foreground-content-neutral)' };`,
		},
		{
			code: `const { '--wpds-color-foreground-content-neutral': neutralColor } = styles;`,
		},
		{
			code: `const css = '--my-custom-prop: red;';`,
		},
		{
			code: 'const css = `--my-custom-prop-${ suffix }: red;`;',
		},
		{
			code: 'const css = `--my-custom-prop: red;`;',
		},
		{
			code: '<style>{ `--my-custom-prop-${ suffix }: red;` }</style>',
		},
	],
	invalid: [
		{
			code: `<div style={ { '--wpds-color-foreground-content-neutral': 'red' } } />`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `<div style={ { '--wpds-typography-font-size-md': '10px', color: 'blue' } } />`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `const styles = { '--wpds-color-foreground-content-neutral': 'red' };`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `function getStyles() { return { '--wpds-typography-font-size-md': '10px' }; }`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `const config = { inner: { '--wpds-color-foreground-content-neutral': 'red' } };`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: `const css = '--wpds-color-foreground-content-neutral: red;';`,
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: 'const css = `--wpds-color-foreground-content-neutral: red;`;',
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: 'const css = `--wpds-color-foreground-content-neutral: ${ value };`;',
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: 'const css = `--wpds-color-${ suffix }: red;`;',
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
		{
			code: '<style>{ `--wpds-color-${ suffix }: red;` }</style>',
			errors: [
				{
					messageId: 'disallowedSet',
				},
			],
		},
	],
} );
