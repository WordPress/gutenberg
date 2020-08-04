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
		ecmaFeatures: {
			jsx: true,
		},
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
		{
			code: `
function example() {
	const { foo, bar } = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + bar + 1;
	}

	return number + foo;
}`,
		},
		{
			code: `
function example() {
	const foo = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo;
}`,
			options: [ { excludePattern: '^do' } ],
		},
		{
			code: `
function MyComponent() {
	const Foo = getSomeComponent();
	return <Foo />;
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
			errors: [
				{
					message:
						'Variables should not be assigned until just prior its first reference. An early return statement may leave this variable unused.',
				},
			],
		},
		{
			code: `
function example() {
	const { foo } = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo;
}`,
			errors: [
				{
					message:
						'Variables should not be assigned until just prior its first reference. An early return statement may leave this variable unused.',
				},
			],
		},
		{
			code: `
function example() {
	const foo = doSomeCostlyOperation();
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo;
}`,
			options: [ { excludePattern: '^run' } ],
			errors: [
				{
					message:
						'Variables should not be assigned until just prior its first reference. An early return statement may leave this variable unused.',
				},
			],
		},
		{
			code: `
function example() {
	const foo = doSomeCostlyOperation();
	const bar = anotherCostlyOperation( foo );
	if ( number > 10 ) {
		return number + 1;
	}

	return number + foo + bar;
}`,
			options: [ { excludePattern: '^do' } ],
			errors: [
				{
					message:
						'Variables should not be assigned until just prior its first reference. An early return statement may leave this variable unused.',
				},
			],
		},
	],
} );
