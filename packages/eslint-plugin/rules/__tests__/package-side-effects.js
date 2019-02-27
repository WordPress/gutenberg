/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../package-side-effects';

const mockPackageJson = {
	sideEffects: [
		'src/has-side-effects.js',
		'./src/also-has-side-effects.js',
	],
};

jest.mock( 'read-pkg-up', () => {
	return {
		sync: jest.fn( () => ( {
			pkg: mockPackageJson,
			path: '',
		} ) ),
	};
} );

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'package-side-effects', rule, {
	valid: [
		{ code: `window.addEventListener( 'resize', handleResize );`, filename: 'src/has-side-effects.js' },
		{ code: `registerStore( store );`, filename: 'src/also-has-side-effects.js' },
		{ code: `const value = functionCall();`, filename: 'src/index.js' },
	],
	invalid: [
		{
			code: `window.addEventListener( 'resize', handleResize );`,
			filename: 'src/index.js',
			errors: [ { message: `Call to function may introduce package level side-effects. Consider adding 'src/index.js' to the package's package.json sideEffect property.` } ],
		},
	],
} );
