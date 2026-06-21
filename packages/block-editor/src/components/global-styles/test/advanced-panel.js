/**
 * Internal dependencies
 */
import { getCSSDeclarationBlockValidationError } from '../advanced-panel';

describe( 'getCSSDeclarationBlockValidationError', () => {
	beforeEach( () => {
		jest.spyOn( console, 'warn' ).mockImplementation( jest.fn() );
	} );

	it( 'should allow valid declaration-list CSS', () => {
		expect(
			getCSSDeclarationBlockValidationError(
				'color: red; padding: 1rem;'
			)
		).toBeNull();
	} );

	it( 'should reject CSS wrapped in curly braces', () => {
		expect(
			getCSSDeclarationBlockValidationError( '{ color: red; }' )
		).toBe( 'Enter CSS declarations without curly braces.' );
	} );

	it( 'should reject markup', () => {
		expect(
			getCSSDeclarationBlockValidationError(
				'</style><script>alert("x")</script>'
			)
		).toBe( 'The custom CSS is invalid. Do not use <> markup.' );
	} );

	it( 'should reject malformed declaration-list CSS', () => {
		expect( getCSSDeclarationBlockValidationError( 'color red;' ) ).toBe(
			'There is an error with your CSS structure.'
		);
		expect( console ).toHaveWarned();
	} );
} );
