/* global jest */
const { expect, test } = require( '@jest/globals' );

test( 'keeps console spies active when Jest restores runtime mocks', () => {
	// eslint-disable-next-line no-console
	const errorSpy = console.error;

	jest.restoreAllMocks();

	// eslint-disable-next-line no-console
	expect( console.error ).toBe( errorSpy );
	// eslint-disable-next-line no-console
	console.error( 'Expected error.' );
	expect( console ).toHaveErroredWith( 'Expected error.' );
} );
