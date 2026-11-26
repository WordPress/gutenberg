import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-plural-placeholder';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-plural-placeholder', rule, {
	valid: [
		{
			code: `_n( '%d block', '%d blocks', count )`,
		},
		{
			code: `_n( 'One block', '%d blocks', count )`,
		},
		{
			code: `_nx( '%s block', '%s blocks', count, 'context' )`,
		},
		{
			code: `i18n._n( '%1$d block', '%1$d blocks', count )`,
		},
		{
			code: `_n( '<BlockCount /> block', '<BlockCount /> blocks', count )`,
		},
		{
			code: `_n( singular, plural, count )`,
		},
		{
			code: `_n( null, 'items', count )`,
		},
		{
			code: `_n( 1, 'items', count )`,
		},
		{
			code: `__( 'This block' )`,
		},
	],
	invalid: [
		{
			code: `_n( 'This block', 'These blocks', count )`,
			errors: [ { messageId: 'missingPlaceholder' } ],
		},
		{
			code: `_nx( 'This block', 'These blocks', count, '%d context' )`,
			errors: [ { messageId: 'missingPlaceholder' } ],
		},
		{
			code: `i18n._n( '100%% done', '100%% done', count )`,
			errors: [ { messageId: 'missingPlaceholder' } ],
		},
		{
			code: `_n( 'Add <a>block</a>', 'Add <a>blocks</a>', count )`,
			errors: [ { messageId: 'missingPlaceholder' } ],
		},
	],
} );
