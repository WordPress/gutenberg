import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-translator-comments-position';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 2022,
		sourceType: 'module',
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
} );

const errors = [ { messageId: 'incompatiblePosition' } ];

ruleTester.run( 'i18n-translator-comments-position', rule, {
	valid: [
		{
			code: `
sprintf(
	/* translators: %s: Address. */
	__( 'Address: %s' ),
	address
);`,
		},
		{
			code: `
const label =
	/* translators: Word count type. */
	_x( 'words', 'Word count type' );`,
		},
		{
			code: `
const el = <Button
	label={
		/* translators: Keep under 16 characters. */
		__( 'More' )
	}
/>;`,
		},
		{
			code: `
const label = condition
	? other
	: /* translators: Default document label. */
		_x( 'Document', 'noun' );`,
		},
		{
			code: `
const strings = {
	/* translators: %s: Name. */
	name: __( 'Name: %s' ),
};`,
		},
		{
			// A comment too far from the call is not attached by `make-pot`
			// either, so this rule leaves it to `i18n-translator-comments`.
			code: `
/* translators: orphaned */

const unrelated = 1;
const label = __( 'Hello' );`,
		},
		{
			// Not a translator comment.
			code: `
// A plain note.
const label = __( 'Hello' );`,
		},
	],
	invalid: [
		{
			code: `
function f( name ) {
	/* translators: %s: Name. */
	return sprintf( __( 'Saved by %s.' ), name );
}`,
			output: `
function f( name ) {
	return sprintf( __( /* translators: %s: Name. */ 'Saved by %s.' ), name );
}`,
			errors,
		},
		{
			code: `
// translators: Word count type.
const t = _x( 'words', 'Word count type' );`,
			output: `
const t = _x( /* translators: Word count type. */ 'words', 'Word count type' );`,
			errors,
		},
		{
			code: `
const el = <Button
	/* translators: Keep under 16 characters. */
	label={ __( 'More' ) }
/>;`,
			output: `
const el = <Button
	label={ __( /* translators: Keep under 16 characters. */ 'More' ) }
/>;`,
			errors,
		},
		{
			code: `
const el = <span>
	{ /* translators: Time format. */ }
	{ dateI18n( __( 'g:i a' ), d ) }
</span>;`,
			output: `
const el = <span>
	{  }
	{ dateI18n( __( /* translators: Time format. */ 'g:i a' ), d ) }
</span>;`,
			errors,
		},
		{
			// A `*/` in a line comment is defanged when it becomes a block
			// comment.
			code: `
// translators: see https://example.com/*/ for details
const t = __( 'Hello' );`,
			output: `
const t = __( /* translators: see https://example.com/* / for details */ 'Hello' );`,
			errors,
		},
	],
} );
