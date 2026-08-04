import { RuleTester } from 'eslint';
import rule from '../jsdoc-valid-since';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
	},
} );

ruleTester.run( 'jsdoc-valid-since', rule, {
	valid: [
		'/** @since 8.8.8 */\nconst value = true;',
		'/** @since 8.8.8 An awesome change */\nconst value = true;',
		'/** @since 0.0.0 */\nconst value = true;',
		'/** @since 1.2.3-alpha.1 */\nconst value = true;',
		'/** @since 1.2.3+build.5 */\nconst value = true;',
		'/** @since 1.2.3-beta.2+build.5 A description */\nconst value = true;',
		'/** A JSDoc comment without a since tag. */\nconst value = true;',
	],
	invalid: [
		{
			code: '/** @since 3.14 */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
		{
			code: '/** @since version 7 */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
		{
			code: '/** @since 6.7.x */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
		{
			code: '/** @since */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
		{
			code: '/** @since 01.2.3 */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
		{
			code: '/** @since 1.2.3-01 */\nconst value = true;',
			errors: [ { messageId: 'invalidSince' } ],
		},
	],
} );
