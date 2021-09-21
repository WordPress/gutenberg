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
			code: `const someVar = 1; // Describe the var.`,
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
			code: `const someVar = 1; // Describe the var`,
			output: `const someVar = 1; // Describe the var.`,
			errors: [ { messageId: 'missingPunctuation' } ],
		},
		{
			code: `const someVar = 1; // no capital letter.`,
			output: `const someVar = 1; // No capital letter.`,
			errors: [ { messageId: 'capitalLetter' } ],
		},
		{
			code: `const someVar = 1; // Describe the var
			const someOtherVar = 2; // Describe this one too`,
			output: `const someVar = 1; // Describe the var.
			const someOtherVar = 2; // Describe this one too.`,
			errors: [
				{ messageId: 'missingPunctuation' },
				{ messageId: 'missingPunctuation' },
			],
		},
		{
			code: `// My comment without a period`,
			output: `// My comment without a period.`,
			errors: [ { messageId: 'missingPunctuation' } ],
		},
		{
			code: `//My comment without a space.`,
			output: `// My comment without a space.`,
			errors: [ { messageId: 'missingSpace' } ],
		},
		{
			code: `//My multi line
			//comments without
			//spaces`,
			output: `// My multi line
			// comments without
			// spaces`, // No period here because this test case is for a single pass.
			errors: [
				{ messageId: 'missingSpace' },
				{ messageId: 'missingSpace' },
				{ messageId: 'missingSpace' },
				{ messageId: 'missingPunctuation' },
			],
		},
	],
} );
