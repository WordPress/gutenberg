/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unused-vars-before-return';

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
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
		{
			code: `
function example() {
    const [ h, m, s ] = getTime();

    if (h > 0) {
        return \`\${ h }:\${ m }\`;
    }

    if (m > 0) {
        return \`\${ m }:\${ s }\`;
    }

    return \`0:\${ s }\`;
}`,
		},
		{
			code: `
function example() {
    const [ h, , s ] = getTime();

    if (h > 0) {
        return h;
    }

    return s;
}`,
		},
		{
			code: `
function example() {
    const [ h, m ] = getTime();

    if (h > 0) {
        return h;
    }

    return m;
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
		{
			code: `
function example() {
    const [ x ] = getThing();
    if ( number > 10 ) {
        return number + 1;
    }

    return x;
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
    const [ x, ] = getThing();
    if ( number > 10 ) {
        return number + 1;
    }

    return x;
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
    const [ , x ] = getThing();
    if ( number > 10 ) {
        return number + 1;
    }

    return x;
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
    const [ , , z ] = getThing();
    if ( number > 10 ) {
        return number + 1;
    }

    return z;
}`,
			errors: [
				{
					message:
						'Variables should not be assigned until just prior its first reference. An early return statement may leave this variable unused.',
				},
			],
		},
	],
} );
