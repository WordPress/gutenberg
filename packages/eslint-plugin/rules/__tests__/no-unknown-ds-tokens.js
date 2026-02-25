/* eslint-disable @wordpress/no-unknown-ds-tokens */
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
	],
	invalid: [
		{
			code: `<div style={ { color: 'var(--wpds-nonexistent-token)' } } />`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
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
				},
			],
		},
		{
			code: `const token = 'var(--wpds-nonexistent-token)';`,
			errors: [
				{
					messageId: 'onlyKnownTokens',
				},
			],
		},
		{
			code: 'const token = `var(--wpds-nonexistent-token)`;',
			errors: [
				{
					messageId: 'onlyKnownTokens',
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
	],
} );
/* eslint-enable @wordpress/no-unknown-ds-tokens */
