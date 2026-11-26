import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-ordered-placeholders';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

/**
 * Returns the expected error for a string, with the suggestion to number its
 * placeholders when one is offered.
 *
 * @param {?string} output Code after applying the suggestion, if one is offered.
 *
 * @return {Object} Expected error.
 */
function unordered( output = null ) {
	return {
		messageId: 'unorderedPlaceholders',
		suggestions: output
			? [ { messageId: 'numberPlaceholders', output } ]
			: [],
	};
}

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
			// Matches with a space flag are plain text, not placeholders.
			code: `__( '50% done, 20% left' )`,
		},
		{
			code: `__( '100% secure and 50% faster' )`,
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
			errors: [ unordered( `__( '%1$s of %2$s' )` ) ],
		},
		{
			code: `i18n.__( "%d of %.2f" )`,
			errors: [ unordered( `i18n.__( "%1$d of %2$.2f" )` ) ],
		},
		{
			code: `_x( '%s by %s', 'post title and author' )`,
			errors: [
				unordered( `_x( '%1$s by %2$s', 'post title and author' )` ),
			],
		},
		{
			code: `_n( '%d block in %s', '%d blocks in %s', count )`,
			errors: [
				unordered(
					`_n( '%1$d block in %2$s', '%d blocks in %s', count )`
				),
				unordered(
					`_n( '%d block in %s', '%1$d blocks in %2$s', count )`
				),
			],
		},
		{
			code: `_nx( '%s %%s %d', '%1$s %%s %2$d', count, 'context' )`,
			errors: [
				unordered(
					`_nx( '%1$s %%s %2$d', '%1$s %%s %2$d', count, 'context' )`
				),
			],
		},
		{
			code: `__( '%s of %s, 50% done' )`,
			errors: [ unordered( `__( '%1$s of %2$s, 50% done' )` ) ],
		},
		{
			// Mixed ordered and unordered placeholders are ambiguous, so
			// no suggestion is offered.
			code: `__( '%1$s of %s' )`,
			errors: [ unordered() ],
		},
		{
			code: `__( '%.*f of %s' )`,
			errors: [ unordered() ],
		},
		{
			code: `__( '%s of ' + '%s' )`,
			errors: [ unordered() ],
		},
		{
			// Escape sequences can hide placeholders in the source text.
			code: `__( '\\x25%s %\\x73 %s' )`,
			errors: [ unordered() ],
		},
		{
			code: `sprintf( __( '%s of %s' ), a, b )`,
			errors: [ unordered( `sprintf( __( '%1$s of %2$s' ), a, b )` ) ],
		},
	],
} );
