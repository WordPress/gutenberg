/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../comment-case';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'comment-case', rule, {
	valid: [
		{
			code: `// My period ending comment.`,
		},
		{
			code: `// My exclamation ending comment!`,
		},
		{
			code: `// My question mark ending comment?`,
		},
		{
			code: `// @see type comments don't need to be punctuated`,
		},
		{
			code: `// @todo type comments don't need to be punctuated`,
		},
		{
			code: `// My period ending comment
			// that runs on to the next line.`,
		},
		{
			code: `// A few.
			// comments that all end.
			// with periods.`,
		},
		{
			code: `// My exclamation ending comment
			// that runs on to the next line!`,
		},
	],
	invalid: [
		{
			code: `// My comment without a period`,
			output: `// My comment without a period.`,
			errors: [ { messageId: 'missingPunctuation' } ],
		},
	],
} );
