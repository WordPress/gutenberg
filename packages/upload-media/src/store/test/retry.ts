/**
 * Internal dependencies
 */
import { calculateRetryDelay, shouldRetryError } from '../utils/retry';
import { UploadError } from '../../upload-error';

describe( 'calculateRetryDelay', () => {
	const originalRandom = Math.random;

	beforeEach( () => {
		// Force the jitter factor to 1 (no offset) for deterministic results.
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

		// attempt 1: 1000 * 2^0 = 1000.
		expect( calculateRetryDelay( { ...options, attempt: 1 } ) ).toBe(
			1000
		);

		// attempt 2: 1000 * 2^1 = 2000.
		expect( calculateRetryDelay( { ...options, attempt: 2 } ) ).toBe(
			2000
		);

		// attempt 3: 1000 * 2^2 = 4000.
		expect( calculateRetryDelay( { ...options, attempt: 3 } ) ).toBe(
			4000
		);

		// attempt 4: 1000 * 2^3 = 8000.
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

		// 1000 * 2^9 = 512000, capped at 5000.
		expect( delay ).toBe( 5000 );
	} );

	it( 'should apply jitter factor', () => {
		// Math.random = 0.5 → jitter factor = 1 + (0.5 * 2 - 1) * 0.1 = 1.
		const delayWithMiddleJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		expect( delayWithMiddleJitter ).toBe( 1000 );

		// Math.random = 0 → jitter factor = 1 + (0 * 2 - 1) * 0.1 = 0.9.
		Math.random = jest.fn( () => 0 );
		const delayWithMinJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		expect( delayWithMinJitter ).toBe( 900 );

		// Math.random = 1 → jitter factor = 1 + (1 * 2 - 1) * 0.1 = 1.1.
		Math.random = jest.fn( () => 1 );
		const delayWithMaxJitter = calculateRetryDelay( {
			attempt: 1,
			initialDelay: 1000,
			maxDelay: 30000,
			multiplier: 2,
			jitter: 0.1,
		} );
		expect( delayWithMaxJitter ).toBe( 1100 );
	} );

	it( 'should handle different multipliers', () => {
		const options = {
			initialDelay: 1000,
			maxDelay: 100000,
			jitter: 0,
		};

		// multiplier 3: 1000 * 3^2 = 9000.
		expect(
			calculateRetryDelay( { ...options, attempt: 3, multiplier: 3 } )
		).toBe( 9000 );

		// multiplier 1.5: 1000 * 1.5^2 = 2250.
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

		// 1000 * 1.5^1 = 1500.
		expect( Number.isInteger( delay ) ).toBe( true );
		expect( delay ).toBe( 1500 );
	} );
} );

describe( 'shouldRetryError', () => {
	describe( 'retryable message patterns', () => {
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

		it( 'should match retryable messages passed as a plain string', () => {
			// The editor's media-upload wrapper forwards only the error
			// message (a string) to the queue, so cancelItem frequently
			// receives a string rather than an Error instance.
			expect(
				shouldRetryError(
					'Could not get a valid response from the server.',
					0,
					3
				)
			).toBe( true );
			expect( shouldRetryError( 'Failed to fetch', 0, 3 ) ).toBe( true );
		} );

		it( 'should return false for non-retryable string messages', () => {
			expect( shouldRetryError( 'File too large', 0, 3 ) ).toBe( false );
		} );

		it( 'should respect the retry budget for string messages', () => {
			expect(
				shouldRetryError(
					'Could not get a valid response from the server.',
					3,
					3
				)
			).toBe( false );
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

		it( 'should not retry an UploadError whose message does not match a transient pattern', () => {
			// Mirrors the messages thrown by validate-* and image-processing
			// throw sites — none of them should be retried.
			const error = new UploadError( {
				code: 'IMAGE_TRANSCODING_ERROR',
				message: 'Image could not be transcoded.',
				file: new File( [ 'x' ], 'x.jpg', { type: 'image/jpeg' } ),
			} );
			expect( shouldRetryError( error, 0, 3 ) ).toBe( false );
		} );
	} );

	describe( 'retry count limits', () => {
		const retryableError = () => new Error( 'Network request failed' );

		it( 'should return false when retry count equals max retries', () => {
			expect( shouldRetryError( retryableError(), 3, 3 ) ).toBe( false );
		} );

		it( 'should return false when retry count exceeds max retries', () => {
			expect( shouldRetryError( retryableError(), 4, 3 ) ).toBe( false );
			expect( shouldRetryError( retryableError(), 10, 3 ) ).toBe( false );
		} );

		it( 'should return true when retry count is below max retries for retryable error', () => {
			expect( shouldRetryError( retryableError(), 0, 3 ) ).toBe( true );
			expect( shouldRetryError( retryableError(), 1, 3 ) ).toBe( true );
			expect( shouldRetryError( retryableError(), 2, 3 ) ).toBe( true );
		} );

		it( 'should handle max retries of 0', () => {
			expect( shouldRetryError( retryableError(), 0, 0 ) ).toBe( false );
		} );

		it( 'should handle max retries of 1', () => {
			expect( shouldRetryError( retryableError(), 0, 1 ) ).toBe( true );
			expect( shouldRetryError( retryableError(), 1, 1 ) ).toBe( false );
		} );
	} );
} );
