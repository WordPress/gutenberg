import { RuleTester } from 'eslint';
import rule from '../no-unknown-ds-tokens';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
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
			code: `<div style={ { color: 'var(--wpds-color-fg-content-neutral)' } } />`,
		},
		{
			code: '<div style={ { color: `var(--wpds-color-fg-content-neutral)` } } />',
		},
		{
			code: `const token = 'var(--wpds-color-fg-content-neutral)';`,
		},
		{
			code: `const name = 'something--wpds-color';`,
		},
		{
			code: '`${ prefix }: var(--wpds-color-fg-content-neutral)`',
		},
		{
			code: '`var(--wpds-color-fg-content-neutral) ${ suffix }`',
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
	],
} );
