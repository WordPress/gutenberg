/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unsafe-optional-chaining-negation';

const ruleTester = new RuleTester( {
	parser: require.resolve( 'babel-eslint' ),
	parserOptions: {
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-unsafe-optional-chaining-negation', rule, {
	valid: [
		{
			code: `foo?.bar`,
		},
	],
	invalid: [
		{
			code: `! foo.bar?.baz`,
			errors: [ { messageId: 'unsafeNegation' } ],
		},
	],
} );
