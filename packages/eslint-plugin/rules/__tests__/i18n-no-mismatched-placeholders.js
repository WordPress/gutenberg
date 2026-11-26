import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-no-mismatched-placeholders';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-mismatched-placeholders', rule, {
	valid: [
		{
			code: `_n( '%d block', '%d blocks', count )`,
		},
		{
			code: `_nx( '%1$d block in %2$s', '%1$d blocks in %2$s', count, 'context' )`,
		},
		{
			code: `_n( '%1$d block in %2$s', 'In %2$s: %1$d blocks', count )`,
		},
		{
			code: `_n( '%s %d', '%1$s %2$d', count )`,
		},
		{
			code: `_n( '%(count)d block', '%(count)d blocks', count )`,
		},
		{
			code: `_n( '100%% of %d block', '%d blocks', count )`,
		},
		{
			// A singular with fewer placeholders is left to other rules.
			code: `_n( 'One block', '%d blocks', count )`,
		},
		{
			code: `_n( 'This block', 'These blocks', count )`,
		},
		{
			code: `_n( singular, plural, count )`,
		},
		{
			code: `__( '%s' )`,
		},
	],
	invalid: [
		{
			code: `_n( '%s block', '%d blocks', count )`,
			errors: [
				{
					messageId: 'mismatchedPlaceholders',
					data: { singular: '%s', plural: '%d' },
				},
			],
		},
		{
			code: `_n( '%d block in %s', '%d blocks', count )`,
			errors: [
				{
					messageId: 'mismatchedPlaceholders',
					data: { singular: '%d, %s', plural: '%d' },
				},
			],
		},
		{
			code: `i18n._nx( '%1$d block in %2$s', '%1$d blocks in %3$s', count, 'context' )`,
			errors: [ { messageId: 'mismatchedPlaceholders' } ],
		},
		{
			code: `_n( '%(count)d block', '%(total)d blocks', count )`,
			errors: [ { messageId: 'mismatchedPlaceholders' } ],
		},
		{
			code: `_n( '%d block', 'Blocks', count )`,
			errors: [
				{
					messageId: 'mismatchedPlaceholders',
					data: { singular: '%d', plural: 'none' },
				},
			],
		},
	],
} );
