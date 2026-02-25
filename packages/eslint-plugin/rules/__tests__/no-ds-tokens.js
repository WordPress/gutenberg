import { RuleTester } from 'eslint';
import rule from '../no-ds-tokens';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-ds-tokens', rule, {
	valid: [
		{
			code: `const style = 'color: var(--my-custom-prop)';`,
		},
		{
			code: `const style = 'color: blue';`,
		},
		{
			code: 'const style = `border: 1px solid var(--other-prefix-token)`;',
		},
		{
			code: `const name = 'something--wpds-color';`,
		},
		{
			code: `<div style={ { color: 'var(--my-custom-prop)' } } />`,
		},
	],
	invalid: [
		{
			code: `const style = 'color: var(--wpds-color-fg-content-neutral)';`,
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
		{
			code: 'const style = `color: var(--wpds-color-fg-content-neutral)`;',
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
		{
			code: `<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />`,
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
		{
			code: 'const style = `border: 1px solid var(--wpds-border-color, var(--wpds-border-fallback))`;',
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
		{
			code: `const token = '--wpds-color-fg';`,
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
		{
			code: 'const style = `--wpds-color-fg: red`;',
			errors: [
				{
					messageId: 'disallowed',
				},
			],
		},
	],
} );
