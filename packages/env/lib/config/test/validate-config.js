'use strict';
/**
 * Internal dependencies
 */
const {
	ValidationError,
	checkString,
	checkPort,
	checkStringArray,
	checkObjectWithValues,
	checkVersion,
	checkValidURL,
} = require( '../validate-config' );

describe( 'validate-config', () => {
	describe( 'checkString', () => {
		it( 'throws when not a string', () => {
			expect( () => checkString( 'test.json', 'test', 1234 ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a string.'
				)
			);
		} );

		it( 'passes for string', () => {
			expect( () =>
				checkString( 'test.json', 'test', 'test' )
			).not.toThrow();
		} );
	} );

	describe( 'checkPort', () => {
		it( 'throws when not a number', () => {
			expect( () => checkPort( 'test.json', 'test', 'test' ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an integer.'
				)
			);

			expect( () =>
				checkPort( 'test.json', 'test', { test: 'test' } )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an integer.'
				)
			);
		} );

		it( 'throws when port out of range', () => {
			expect( () => checkPort( 'test.json', 'test', -1 ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a valid port.'
				)
			);

			expect( () => checkPort( 'test.json', 'test', 99999999 ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a valid port.'
				)
			);
		} );

		it( 'passes for valid port', () => {
			expect( () =>
				checkPort( 'test.json', 'test', 8888 )
			).not.toThrow();
		} );
	} );

	describe( 'checkStringArray', () => {
		it( 'throws when not an array', () => {
			expect( () =>
				checkStringArray( 'test.json', 'test', 'test' )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an array.'
				)
			);

			expect( () =>
				checkStringArray( 'test.json', 'test', { test: 'test' } )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an array.'
				)
			);
		} );

		it( 'throws when array contains non-strings', () => {
			expect( () =>
				checkStringArray( 'test.json', 'test', [ 12 ] )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an array of strings.'
				)
			);

			expect( () =>
				checkStringArray( 'test.json', 'test', [ 'test', 12 ] )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an array of strings.'
				)
			);
		} );

		it( 'passes for string arrays', () => {
			expect( () =>
				checkStringArray( 'test.json', 'test', [] )
			).not.toThrow();
			expect( () =>
				checkStringArray( 'test.json', 'test', [ 'test' ] )
			).not.toThrow();
		} );
	} );

	describe( 'checkObjectWithValues', () => {
		it( 'throws when not an object', () => {
			expect( () =>
				checkObjectWithValues( 'test.json', 'test', 'test', [], false )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an object.'
				)
			);

			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					[ 'test' ],
					[],
					false
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be an object.'
				)
			);
		} );

		it( 'throws when no allowed types are given', () => {
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: 'test' },
					[],
					false
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test.test" must be of type: .'
				)
			);
		} );

		it( 'throws when type is not allowed', () => {
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: 'test' },
					[ 'number' ],
					false
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test.test" must be of type: number.'
				)
			);

			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: 1 },
					[ 'string' ],
					false
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test.test" must be of type: string.'
				)
			);

			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: [ 'test' ] },
					[ 'object', 'string' ],
					false
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test.test" must be of type: object or string.'
				)
			);

			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: null },
					[ 'object' ],
					true
				)
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test.test" must be of type: object.'
				)
			);
		} );

		it( 'passes when type is allowed', () => {
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: 'test' },
					[ 'string' ],
					false
				)
			).not.toThrow();
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: '' },
					[ 'string' ],
					true
				)
			).not.toThrow();
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: 1 },
					[ 'number' ],
					false
				)
			).not.toThrow();
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: { nested: 'test' } },
					[ 'object' ],
					false
				)
			).not.toThrow();
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: [ 'test' ] },
					[ 'array' ],
					false
				)
			).not.toThrow();
			expect( () =>
				checkObjectWithValues(
					'test.json',
					'test',
					{ test: null },
					[ 'null' ],
					false
				)
			).not.toThrow();
		} );
	} );

	describe( 'checkVersion', () => {
		it( 'throws for invalid input', () => {
			expect( () => checkVersion( 'test.json', 'test', 'test' ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a string of the format "X", "X.X", or "X.X.X".'
				)
			);

			expect( () => checkVersion( 'test.json', 'test', 123 ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a string.'
				)
			);
		} );

		it( 'passes for different version formats', () => {
			expect( () =>
				checkVersion( 'test.json', 'test', '1' )
			).not.toThrow();
			expect( () =>
				checkVersion( 'test.json', 'test', '1.1' )
			).not.toThrow();
			expect( () =>
				checkVersion( 'test.json', 'test', '1.1.1' )
			).not.toThrow();
			expect( () =>
				checkVersion( 'test.json', 'test', '15.7.2' )
			).not.toThrow();
			expect( () =>
				checkVersion( 'test.json', 'test', '26634543' )
			).not.toThrow();
		} );
	} );

	describe( 'checkValidURL', () => {
		it( 'throws for invaid URLs', () => {
			expect( () =>
				checkValidURL( 'test.json', 'test', 'localhost' )
			).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a valid URL.'
				)
			);

			expect( () => checkValidURL( 'test.json', 'test', '' ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a valid URL.'
				)
			);

			expect( () => checkValidURL( 'test.json', 'test', 123 ) ).toThrow(
				new ValidationError(
					'Invalid test.json: "test" must be a valid URL.'
				)
			);
		} );

		it( 'passes for valid URLs', () => {
			expect( () =>
				checkValidURL( 'test.json', 'test', 'http://test.com' )
			).not.toThrow();
			expect( () =>
				checkValidURL( 'test.json', 'test', 'https://test.com' )
			).not.toThrow();
			expect( () =>
				checkValidURL( 'test.json', 'test', 'http://test' )
			).not.toThrow();
			expect( () =>
				checkValidURL(
					'test.json',
					'test',
					'http://test/test?test=test'
				)
			).not.toThrow();
			expect( () =>
				checkValidURL( 'test.json', 'test', 'http://test.co.uk' )
			).not.toThrow();
			expect( () =>
				checkValidURL( 'test.json', 'test', 'https://test.co.uk:8888' )
			).not.toThrow();
			expect( () =>
				checkValidURL(
					'test.json',
					'test',
					'http://test.co.uk:8888/test?test=test#test'
				)
			).not.toThrow();
		} );
	} );
} );
