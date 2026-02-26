/**
 * Internal dependencies
 */
import { calculateRetryDelay, shouldRetryError } from '../utils/retry';
import { UploadError, ErrorCode } from '../../upload-error';

describe( 'calculateRetryDelay', () => {
	// Mock Math.random to return predictable values for testing
	const originalRandom = Math.random;

	beforeEach( () => {
		// Mock Math.random to return 0.5 (middle of range, so jitter factor = 1)
		Math.random = jest.fn( () => 0.5 );
	} );

	afterEach( () => {
		Math.random = originalRandom;
	} );

	it( 'should return initial delay for first attempt', () => {
		const delay = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0,
		} );

		expect( delay ).toBe( 1000 );
	} );

	it( 'should apply exponential backoff for subsequent attempts', () => {
		const options = {
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0,
		};

		// attempt 1: 1000 * 2^0 = 1000
		expect( calculateRetryDelay( { ...options, attempt: 1 } ) ).toBe(
			1000
		);

		// attempt 2: 1000 * 2^1 = 2000
		expect( calculateRetryDelay( { ...options, attempt: 2 } ) ).toBe(
			2000
		);

		// attempt 3: 1000 * 2^2 = 4000
		expect( calculateRetryDelay( { ...options, attempt: 3 } ) ).toBe(
			4000
		);

		// attempt 4: 1000 * 2^3 = 8000
		expect( calculateRetryDelay( { ...options, attempt: 4 } ) ).toBe(
			8000
		);
	} );

	it( 'should cap delay at maxDelay', () => {
		const delay = calculateRetryDelay( {
			attempt: 10,
			initialDelay: 1000,
			maxDelay: 5000,
			multiplier: 2,
			jitter: 0,
		} );

		// 1000 * 2^9 = 512000, but capped at 5000
		expect( delay ).toBe( 5000 );
	} );

	it( 'should apply jitter factor', () => {
		// With Math.random returning 0.5, jitter factor = 1 + (0.5 * 2 - 1) * 0.1 = 1
		const delayWithMiddleJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		expect( delayWithMiddleJitter ).toBe( 1000 );

		// Test with Math.random returning 0 (minimum jitter)
		Math.random = jest.fn( () => 0 );
		const delayWithMinJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		// jitter factor = 1 + (0 * 2 - 1) * 0.1 = 0.9
		expect( delayWithMinJitter ).toBe( 900 );

		// Test with Math.random returning 1 (maximum jitter)
		Math.random = jest.fn( () => 1 );
		const delayWithMaxJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		// jitter factor = 1 + (1 * 2 - 1) * 0.1 = 1.1
		expect( delayWithMaxJitter ).toBe( 1100 );
	} );

	it( 'should handle different multipliers', () => {
		const options = {
			initialDelay: 1000,
			maxDelay: 100000,
			jitter: 0,
		};

		// multiplier 3: 1000 * 3^2 = 9000
		expect(
			calculateRetryDelay( { ...options, attempt: 3, multiplier: 3 } )
		).toBe( 9000 );

		// multiplier 1.5: 1000 * 1.5^2 = 2250
		expect(
			calculateRetryDelay( { ...options, attempt: 3, multiplier: 1.5 } )
		).toBe( 2250 );
	} );

	it( 'should return floored integer values', () => {
		const delay = calculateRetryDelay( {
			attempt: 2,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 1.5,
			jitter: 0,
		} );

		// 1000 * 1.5^1 = 1500
		expect( Number.isInteger( delay ) ).toBe( true );
		expect( delay ).toBe( 1500 );
	} );
} );

describe( 'shouldRetryError', () => {
	const createMockFile = (): File => {
		return new File( [ 'test' ], 'test.jpg', { type: 'image/jpeg' } );
	};

	describe( 'with UploadError', () => {
		it( 'should return true for NETWORK_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( true );
			expect( shouldRetryError( error, 1, 3 ) ).toBe( true );
			expect( shouldRetryError( error, 2, 3 ) ).toBe( true );
		} );

		it( 'should return true for TIMEOUT_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.TIMEOUT_ERROR,
				message: 'Request timed out',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( true );
		} );

		it( 'should return true for SERVER_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.SERVER_ERROR,
				message: 'Internal server error',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( true );
		} );

		it( 'should return true for VIPS_WORKER_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.VIPS_WORKER_ERROR,
				message: 'VIPS worker crashed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( true );
		} );

		it( 'should return false for VALIDATION_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.VALIDATION_ERROR,
				message: 'Invalid file',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );

		it( 'should return false for PERMISSION_DENIED', () => {
			const error = new UploadError( {
				code: ErrorCode.PERMISSION_DENIED,
				message: 'Access denied',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );

		it( 'should return false for FILE_TOO_LARGE', () => {
			const error = new UploadError( {
				code: ErrorCode.FILE_TOO_LARGE,
				message: 'File exceeds limit',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );

		it( 'should return false for INVALID_MIME_TYPE', () => {
			const error = new UploadError( {
				code: ErrorCode.INVALID_MIME_TYPE,
				message: 'Unsupported file type',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );

		it( 'should return false for ABORTED', () => {
			const error = new UploadError( {
				code: ErrorCode.ABORTED,
				message: 'Upload cancelled',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );

		it( 'should return false for IMAGE_TRANSCODING_ERROR', () => {
			const error = new UploadError( {
				code: ErrorCode.IMAGE_TRANSCODING_ERROR,
				message: 'Failed to transcode',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );
	} );

	describe( 'with generic Error', () => {
		it( 'should return true for network-related error messages', () => {
			expect(
				shouldRetryError( new Error( 'Network request failed' ), 0, 3 )
			).toBe( true );
			expect(
				shouldRetryError( new Error( 'NETWORK_ERROR occurred' ), 0, 3 )
			).toBe( true );
		} );

		it( 'should return true for timeout-related error messages', () => {
			expect(
				shouldRetryError( new Error( 'Request timeout' ), 0, 3 )
			).toBe( true );
			expect( shouldRetryError( new Error( 'ETIMEDOUT' ), 0, 3 ) ).toBe(
				true
			);
		} );

		it( 'should return true for connection-related error messages', () => {
			expect( shouldRetryError( new Error( 'ECONNRESET' ), 0, 3 ) ).toBe(
				true
			);
			expect(
				shouldRetryError( new Error( 'Connection refused' ), 0, 3 )
			).toBe( true );
			expect(
				shouldRetryError( new Error( 'Socket hang up' ), 0, 3 )
			).toBe( true );
		} );

		it( 'should return true for fetch failed errors', () => {
			expect(
				shouldRetryError( new Error( 'fetch failed' ), 0, 3 )
			).toBe( true );
		} );

		it( 'should return true for apiFetch fetch_error messages', () => {
			expect(
				shouldRetryError(
					new Error(
						'Could not get a valid response from the server.'
					),
					0,
					3
				)
			).toBe( true );
		} );

		it( 'should return true for Chrome raw fetch TypeError', () => {
			expect(
				shouldRetryError( new Error( 'Failed to fetch' ), 0, 3 )
			).toBe( true );
		} );

		it( 'should return true for Safari raw fetch TypeError', () => {
			expect( shouldRetryError( new Error( 'Load failed' ), 0, 3 ) ).toBe(
				true
			);
		} );

		it( 'should return true for ENOTFOUND errors', () => {
			expect( shouldRetryError( new Error( 'ENOTFOUND' ), 0, 3 ) ).toBe(
				true
			);
		} );

		it( 'should return false for non-retryable error messages', () => {
			expect(
				shouldRetryError( new Error( 'File too large' ), 0, 3 )
			).toBe( false );
			expect(
				shouldRetryError( new Error( 'Invalid format' ), 0, 3 )
			).toBe( false );
			expect(
				shouldRetryError( new Error( 'Permission denied' ), 0, 3 )
			).toBe( false );
		} );

		it( 'should handle errors with empty messages', () => {
			expect( shouldRetryError( new Error( '' ), 0, 3 ) ).toBe( false );
		} );
	} );

	describe( 'retry count limits', () => {
		it( 'should return false when retry count equals max retries', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 3, 3 ) ).toBe( false );
		} );

		it( 'should return false when retry count exceeds max retries', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 4, 3 ) ).toBe( false );
			expect( shouldRetryError( error, 10, 3 ) ).toBe( false );
		} );

		it( 'should return true when retry count is below max retries for retryable error', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 3 ) ).toBe( true );
			expect( shouldRetryError( error, 1, 3 ) ).toBe( true );
			expect( shouldRetryError( error, 2, 3 ) ).toBe( true );
		} );

		it( 'should handle max retries of 0', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 0 ) ).toBe( false );
		} );

		it( 'should handle max retries of 1', () => {
			const error = new UploadError( {
				code: ErrorCode.NETWORK_ERROR,
				message: 'Network failed',
				file: createMockFile(),
			} );

			expect( shouldRetryError( error, 0, 1 ) ).toBe( true );
			expect( shouldRetryError( error, 1, 1 ) ).toBe( false );
		} );
	} );
} );
