/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import defaultProcessor from '../default-processor';

jest.mock( '@wordpress/api-fetch' );

describe( 'defaultProcessor', () => {
	const requests = [
		{
			path: '/v1/cricketers',
			data: 'Lyon',
			method: 'POST',
			headers: {},
		},
		{
			path: '/v1/cricketers/1',
			data: 'Starc',
			method: 'POST',
			headers: {},
		},
	];

	const expectedFetchOptions = {
		path: '/batch/v1',
		method: 'POST',
		data: {
			validation: 'require-all-validate',
			requests: [
				{
					path: '/v1/cricketers',
					body: 'Lyon',
					method: 'POST',
					headers: {},
				},
				{
					path: '/v1/cricketers/1',
					body: 'Starc',
					method: 'POST',
					headers: {},
				},
			],
		},
	};

	it( 'handles a successful request', async () => {
		apiFetch.mockImplementation( async () => ( {
			failed: false,
			responses: [
				{
					status: 200,
					body: 'Lyon',
				},
				{
					status: 400,
					body: 'Error!',
				},
			],
		} ) );
		const results = await defaultProcessor( requests );
		expect( apiFetch ).toHaveBeenCalledWith( expectedFetchOptions );
		expect( results ).toEqual( [
			{ output: 'Lyon' },
			{ error: 'Error!' },
		] );
	} );

	it( 'handles a failed request', async () => {
		apiFetch.mockImplementation( async () => ( {
			failed: true,
			responses: [
				null,
				{
					status: 400,
					body: 'Error!',
				},
			],
		} ) );
		const results = await defaultProcessor( requests );
		expect( apiFetch ).toHaveBeenCalledWith( expectedFetchOptions );
		expect( results ).toEqual( [
			{ error: undefined },
			{ error: 'Error!' },
		] );
	} );
} );
