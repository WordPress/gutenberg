import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../get-pattern-details';
import { getPatternDetail } from '../../data';
import type { PatternDetail } from '../../types';

vi.mock( import( '../../data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getPatternDetail: vi.fn(),
} ) );

const mockGetPatternDetail = vi.mocked( getPatternDetail );

function fakeDetail( slug: string ): PatternDetail {
	return {
		slug,
		title: slug,
		description: `${ slug } description.`,
		content: `# ${ slug }\n\nGuidance.`,
	};
}

describe( 'handler', () => {
	beforeEach( () => {
		mockGetPatternDetail.mockReset();
	} );

	it( 'returns a single formatted section for a string slug', async () => {
		const destructive = fakeDetail( 'destructive-actions' );
		mockGetPatternDetail.mockResolvedValueOnce( destructive );

		const result = await handler( { slug: 'destructive-actions' } );

		expect( mockGetPatternDetail ).toHaveBeenCalledExactlyOnceWith(
			'destructive-actions'
		);
		expect( result ).toEqual( {
			content: [ { type: 'text', text: destructive.content } ],
		} );
	} );

	it( 'joins multiple patterns with the section separator', async () => {
		const destructive = fakeDetail( 'destructive-actions' );
		const errors = fakeDetail( 'error-messages' );
		mockGetPatternDetail
			.mockResolvedValueOnce( destructive )
			.mockResolvedValueOnce( errors );

		const result = await handler( {
			slug: [ 'destructive-actions', 'error-messages' ],
		} );

		expect( mockGetPatternDetail.mock.calls ).toEqual( [
			[ 'destructive-actions' ],
			[ 'error-messages' ],
		] );
		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: `${ destructive.content }\n\n---\n\n${ errors.content }`,
				},
			],
		} );
	} );

	it( 'appends a missing footer when some slugs are not found', async () => {
		const destructive = fakeDetail( 'destructive-actions' );
		mockGetPatternDetail
			.mockResolvedValueOnce( destructive )
			.mockResolvedValueOnce( null );

		const result = await handler( {
			slug: [ 'destructive-actions', 'nope' ],
		} );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: `${ destructive.content }\n\n---\n\n_No patterns were found for: "nope"._`,
				},
			],
		} );
	} );

	it( 'returns isError when no patterns are found', async () => {
		mockGetPatternDetail.mockResolvedValue( null );

		const result = await handler( { slug: [ 'foo', 'bar' ] } );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: 'No patterns were found for: "foo", "bar". Call get_patterns for the available slugs.',
				},
			],
			isError: true,
		} );
	} );
} );
