import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../get-pattern-details';
import { getPatternDetail } from '../../data';

vi.mock( import( '../../data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	getPatternDetail: vi.fn(),
} ) );

const mockGetPatternDetail = vi.mocked( getPatternDetail );

describe( 'handler', () => {
	beforeEach( () => {
		mockGetPatternDetail.mockReset();
	} );

	it( 'returns the content of the pattern', async () => {
		mockGetPatternDetail.mockResolvedValueOnce( {
			slug: 'destructive-actions',
			title: 'Destructive Actions',
			description: 'Description.',
			content: '# Destructive Actions\n\nGuidance.',
		} );

		const result = await handler( { slug: 'destructive-actions' } );

		expect( result ).toEqual( {
			content: [
				{
					type: 'text',
					text: '# Destructive Actions\n\nGuidance.',
				},
			],
		} );
	} );

	it( 'points to get_patterns when no patterns are found', async () => {
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
