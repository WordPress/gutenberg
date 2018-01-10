/**
 * Internal dependencies
 */
import '..';

describe( 'jest-console', () => {
	describe( 'console.error', () => {
		const message = 'This is error!';

		test( 'toHaveErrored works', () => {
			console.error( message );

			expect( console ).toHaveErrored();
		} );

		test( 'toHaveErrored works when not called', () => {
			expect( console ).not.toHaveErrored();
			expect(
				() => expect( console ).toHaveErrored()
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'toHaveErroredWith works with arguments that match', () => {
			console.error( message );

			expect( console ).toHaveErroredWith( message );
		} );

		test( 'toHaveErroredWith works when not called', () => {
			expect( console ).not.toHaveErroredWith( message );
			expect(
				() => expect( console ).toHaveErroredWith( message )
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'toHaveErroredWith works with many arguments that do not match', () => {
			console.error( 'Unknown message.' );
			console.error( message, 'Unknown param.' );

			expect( console ).not.toHaveErroredWith( message );
			expect(
				() => expect( console ).toHaveErroredWith( message )
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'assertions number gets incremented after every matcher call', () => {
			const spy = console.error;

			expect( spy.assertionsNumber ).toBe( 0 );

			console.error( message );

			expect( console ).toHaveErrored();
			expect( spy.assertionsNumber ).toBe( 1 );

			expect( console ).toHaveErroredWith( message );
			expect( spy.assertionsNumber ).toBe( 2 );
		} );
	} );

	describe( 'console.warn', () => {
		const message = 'This is warning!';

		test( 'toHaveWarned works', () => {
			console.warn( message );

			expect( console ).toHaveWarned();
		} );

		test( 'toHaveWarned works when not called', () => {
			expect( console ).not.toHaveWarned();

			expect(
				() => expect( console ).toHaveWarned()
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'toHaveWarnedWith works with arguments that match', () => {
			console.warn( message );

			expect( console ).toHaveWarnedWith( message );
		} );

		test( 'toHaveWarnedWith works when not called', () => {
			expect( console ).not.toHaveWarnedWith( message );

			expect(
				() => expect( console ).toHaveWarnedWith( message )
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'toHaveWarnedWith works with arguments that do not match', () => {
			console.warn( 'Unknown message.' );
			console.warn( message, 'Unknown param.' );

			expect( console ).not.toHaveWarnedWith( message );

			expect(
				() => expect( console ).toHaveWarnedWith( message )
			).toThrowErrorMatchingSnapshot();
		} );

		test( 'assertions number gets incremented after every matcher call', () => {
			const spy = console.warn;

			expect( spy.assertionsNumber ).toBe( 0 );

			console.warn( message );

			expect( console ).toHaveWarned();
			expect( spy.assertionsNumber ).toBe( 1 );

			expect( console ).toHaveWarnedWith( message );
			expect( spy.assertionsNumber ).toBe( 2 );
		} );
	} );
} );
