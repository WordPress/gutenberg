import { RuleTester } from 'eslint';
import rule from '../no-unknown-ds-tokens';

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

ruleTester.run( 'no-unknown-ds-tokens', rule, {
	valid: [
		{
			code: `<div style={ { color: 'var(--my-custom-prop)' } } />`,
		},
		{
			code: `<div style={ { color: 'blue' } } />`,
		},
		{
			code: `<div style={ { color: 'var(--other-prefix-token)' } } />`,
		},
		{
			code: `<div style={ { color: 'var(--wpds-color-foreground-content-neutral)' } } />`,
		},
		{
			code: '<div style={ { color: `var(--wpds-color-foreground-content-neutral)` } } />',
		},
		{
			code: `const token = 'var(--wpds-color-foreground-content-neutral)';`,
		},
		{
			code: `const name = 'something--wpds-color';`,
		},
		{
			code: '`${ prefix }: var(--wpds-color-foreground-content-neutral)`',
		},
		{
			code: '`var(--wpds-color-foreground-content-neutral) ${ suffix }`',
		},
		{
			code: `const style = { '--wpds-color-foreground-content-neutral': 'red' };`,
		},
		{
			code: `const css = '--wpds-color-foreground-content-neutral: red;';`,
		},
		{
			code: 'const css = `--wpds-color-foreground-content-neutral: red;`;',
		},
		{
			code: 'const css = `--wpds-color-foreground-content-neutral: ${ value };`;',
		},
	],
	invalid: [
		{
			code: `<div style={ { color: 'var(--wpds-nonexistent-token)' } } />`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: `<div style={ { color: 'var(--wpds-fake-color, var(--wpds-also-fake))' } } />`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-fake-color', '--wpds-also-fake'",
					},
				},
			],
		},
		{
			code: '<div style={ { color: `var(--wpds-nonexistent)` } } />',
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent'",
					},
				},
			],
		},
		{
			code: `const token = 'var(--wpds-nonexistent-token)';`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: 'const token = `var(--wpds-nonexistent-token)`;',
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: 'const token = `var(--wpds-dimension-gap-${ size })`;',
			errors: [
				{
					messageId: 'dynamicToken',
				},
			],
		},
		{
			code: '<div style={ { gap: `var(--wpds-dimension-gap-${ size })` } } />',
			errors: [
				{
					messageId: 'dynamicToken',
				},
			],
		},
		{
			code: `const token = '--wpds-nonexistent-token';`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: 'const style = `--wpds-dimension-gap-${ size }`;',
			errors: [
				{
					messageId: 'dynamicToken',
				},
			],
		},
		{
			code: '`${ prefix }: var(--wpds-nonexistent-token)`',
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: `const css = '--wpds-nonexistent-token: red;';`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames: "'--wpds-nonexistent-token'",
					},
				},
			],
		},
		{
			code: `const token = '--wpds-color-foreground-content-neutral';`,
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: 'const token = `--wpds-color-foreground-content-neutral`;',
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: '<div style={ { gap: `--wpds-color-foreground-content-neutral` } } />',
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: '`${ prefix }: --wpds-color-foreground-content-neutral`',
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: '`var(--wpds-color-foreground-content-neutral) --wpds-color-foreground-content-neutral ${ x }`',
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: `const css = '--wpds-color-foreground-content-neutral: red; color: --wpds-color-background-surface-neutral;';`,
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-background-surface-neutral'",
					},
				},
			],
		},
		{
			code: `const css = '--wpds-color-foreground-content-neutral: red; background: --wpds-color-foreground-content-neutral;';`,
			errors: [
				{
					messageId: 'bareToken',
					data: {
						tokenNames: "'--wpds-color-foreground-content-neutral'",
					},
				},
			],
		},
		{
			code: `const css = '--wpds-other-nonexistent-token: red; color: var(--wpds-nonexistent-token);';`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
					data: {
						tokenNames:
							"'--wpds-other-nonexistent-token', '--wpds-nonexistent-token'",
					},
				},
			],
		},
	],
} );
