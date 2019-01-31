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

const ACCESS_ERROR = 'The `GUTENBERG_PHASE` constant should only be accessed as a property of the `window` object using dot notation.';
const EQUALITY_ERROR = 'The `GUTENBERG_PHASE` constant should only be used in a strict equality comparison with a primitive number.';
const IF_ERROR = 'The `GUTENBERG_PHASE` constant should only be used as part of an expression that is the only condition of an if statement.';

ruleTester.run( 'gutenberg-phase', rule, {
	valid: [
		{ code: `if ( window.GUTENBERG_PHASE === 2 ) {}` },
		{ code: `if ( window.GUTENBERG_PHASE !== 2 ) {}` },
		{ code: `if ( 2 === window.GUTENBERG_PHASE ) {}` },
		{ code: `if ( 2 !== window.GUTENBERG_PHASE ) {}` },
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
			code: `if ( window.GUTENBERG_PHASE > 1 ) {}`,
			errors: [ { message: EQUALITY_ERROR } ],
		},
		{
			code: `if ( window.GUTENBERG_PHASE === '2' ) {}`,
			errors: [ { message: EQUALITY_ERROR } ],
		},
		{
			code: `if ( true ) { window.GUTENBERG_PHASE === 2 }`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `if ( true || window.GUTENBERG_PHASE === 2 ) {}`,
			errors: [ { message: IF_ERROR } ],
		},
		{
			code: `const isFeatureActive = window.GUTENBERG_PHASE === 2;`,
			errors: [ { message: IF_ERROR } ],
		},
	],
} );
