import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-ordered-placeholders';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-ordered-placeholders', rule, {
	valid: [
		{
			code: `__( 'Hello %s' )`,
		},
		{
			code: `__( '%1$s of %2$s' )`,
		},
		{
			code: `__( '%2$s of %1$s' )`,
		},
		{
			code: `__( '%(current)s of %(total)s' )`,
		},
		{
			code: `__( '100%% of %s' )`,
		},
		{
			code: `_x( '%1$s of %2$s', 'context with %s and %s' )`,
		},
		{
			code: `_n( '%1$d of %2$d', '%1$d of %2$d', count )`,
		},
		{
			code: `__( value )`,
		},
		{
			code: `sprintf( '%s of %s', a, b )`,
		},
	],
	invalid: [
		{
			code: `__( '%s of %s' )`,
			output: `__( '%1$s of %2$s' )`,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `i18n.__( "%d of %.2f" )`,
			output: `i18n.__( "%1$d of %2$.2f" )`,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `_x( '%s by %s', 'post title and author' )`,
			output: `_x( '%1$s by %2$s', 'post title and author' )`,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `_n( '%d block in %s', '%d blocks in %s', count )`,
			output: `_n( '%1$d block in %2$s', '%1$d blocks in %2$s', count )`,
			errors: [
				{ messageId: 'unorderedPlaceholders' },
				{ messageId: 'unorderedPlaceholders' },
			],
		},
		{
			code: `_nx( '%s %%s %d', '%1$s %%s %2$d', count, 'context' )`,
			output: `_nx( '%1$s %%s %2$d', '%1$s %%s %2$d', count, 'context' )`,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			// Mixed ordered and unordered placeholders are ambiguous, so
			// they are not fixed.
			code: `__( '%1$s of %s' )`,
			output: null,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `__( '%.*f of %s' )`,
			output: null,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `__( '%s of ' + '%s' )`,
			output: null,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
		{
			code: `sprintf( __( '%s of %s' ), a, b )`,
			output: `sprintf( __( '%1$s of %2$s' ), a, b )`,
			errors: [ { messageId: 'unorderedPlaceholders' } ],
		},
	],
} );
