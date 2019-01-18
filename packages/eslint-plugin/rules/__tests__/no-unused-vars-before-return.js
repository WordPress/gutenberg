/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unused-vars-before-return';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-unused-vars-before-return', rule, {
	valid: [
		{
			code: `
function example( number ) {
	if ( number > 10 ) {
		return number + 1;
	}

	const foo = doSomeCostlyOperation();
	return number + foo;
}`,
		},
	],
	invalid: [
		{
			code: `
function example( number ) {
	const foo = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo;
}`,
			errors: [ { message: 'Declared variable `foo` is unused before a return path' } ],
		},
	],
} );
