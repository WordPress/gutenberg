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
			code: `/* Same line block comment. */`,
		},
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
			code: `/* translators: some translation hint */`,
		},
		{
			code: `// translators: some translation hint`,
		},
		{
			code: `// Ends with URL https://github.com/WordPress/gutenberg`,
		},
		{
			code: `// https://github.com/WordPress/gutenberg`,
		},
		{
			code: `// prettier-ignore some rule`,
		},
		{
			code: `// https://github.com/WordPress/gutenberg starts with URL.`,
		},
		{
			code: `const someVar = 1; // Describe the var.`,
		},
		{
			code: `// My period ending comment
			// that runs on to the next line.`,
		},
		{
			code: `const codeOnLine = true; // Disable reason: valid-sprintf applies to \`@wordpress/i18n\` where
// strings are expected to need to be extracted, and thus variables are
// not allowed. This string will not need to be extracted.`,
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
			errors: [ { messageId: 'missingPunctuation' } ],
		},
		{
			code: `const someVar = 1; // no capital letter.`,
			errors: [ { messageId: 'capitalLetter' } ],
		},
		{
			code: `const someVar = 1; // Describe the var
			const someOtherVar = 2; // Describe this one too`,
			errors: [
				{ messageId: 'missingPunctuation' },
				{ messageId: 'missingPunctuation' },
			],
		},
		{
			code: `// My comment without a period`,
			errors: [ { messageId: 'missingPunctuation' } ],
		},
		{
			code: `/* Block comment without a period */`,
			errors: [ { messageId: 'missingPunctuation' } ],
		},
		{
			code: `/*Block comment without a space. */`,
			errors: [ { messageId: 'missingSpace' } ],
		},
		{
			code: `/* block comment without a capital. */`,
			errors: [ { messageId: 'capitalLetter' } ],
		},
		{
			code: `//My comment without a space.`,
			errors: [ { messageId: 'missingSpace' } ],
		},
		{
			code: `//My multi line
			//comments without
			//spaces`,
			errors: [
				{ messageId: 'missingSpace' },
				{ messageId: 'missingSpace' },
				{ messageId: 'missingSpace' },
				{ messageId: 'missingPunctuation' },
			],
		},
	],
} );
