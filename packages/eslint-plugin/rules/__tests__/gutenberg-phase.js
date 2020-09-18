/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../gutenberg-phase';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

const ACCESS_ERROR =
	'The `GUTENBERG_PHASE` constant should be accessed using `process.env.GUTENBERG_PHASE`.';
const EQUALITY_ERROR =
	'The `GUTENBERG_PHASE` constant should only be used in a strict equality comparison with a primitive number.';
const IF_ERROR =
	'The `GUTENBERG_PHASE` constant should only be used as part of the condition in an if statement or ternary expression.';

ruleTester.run( 'gutenberg-phase', rule, {
	valid: [
		{ code: `if ( process.env.GUTENBERG_PHASE === 2 ) {}` },
		{ code: `if ( process.env.GUTENBERG_PHASE !== 2 ) {}` },
		{ code: `if ( 2 === process.env.GUTENBERG_PHASE ) {}` },
		{ code: `if ( 2 !== process.env.GUTENBERG_PHASE ) {}` },
		{ code: `const test = process.env.GUTENBERG_PHASE === 2 ? foo : bar` },
		{ code: `const test = process.env.GUTENBERG_PHASE !== 2 ? foo : bar` },
	],
	invalid: [
		{
			code: `if ( GUTENBERG_PHASE === 1 ) {}`,
			errors: [ { message: ACCESS_ERROR } ],
		},
		{
			code: `if ( window[ 'GUTENBERG_PHASE' ] === 1 ) {}`,
			errors: [ { message: ACCESS_ERROR } ],
		},
		{
			code: `if ( process.env.GUTENBERG_PHASE > 1 ) {}`,
			errors: [ { message: EQUALITY_ERROR } ],
		},
		{
			code: `if ( process.env.GUTENBERG_PHASE === '2' ) {}`,
			errors: [ { message: EQUALITY_ERROR } ],
		},
		{
			code: `if ( true ) { process.env.GUTENBERG_PHASE === 2 }`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `if ( true || process.env.GUTENBERG_PHASE === 2 ) {}`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `const isFeatureActive = process.env.GUTENBERG_PHASE === 2;`,
			errors: [ { message: IF_ERROR } ],
		},
	],
} );
