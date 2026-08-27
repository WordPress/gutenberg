/**
 * Internal dependencies
 */
import { getFieldsDiffEntries } from '../';

function getText( parts, type ) {
	return parts
		.filter( ( part ) => Boolean( part[ type ] ) )
		.map( ( part ) => part.value )
		.join( '' );
}

describe( 'getFieldsDiffEntries', () => {
	it( 'returns no entries without a revision', () => {
		expect( getFieldsDiffEntries( null, null ) ).toEqual( {
			entries: null,
			hasChangedPostFields: false,
		} );
	} );

	it( 'diffs the title against the previous revision', () => {
		const { entries, hasChangedPostFields } = getFieldsDiffEntries(
			{ title: { raw: 'New title' } },
			{ title: { raw: 'Old title' } }
		);

		expect( hasChangedPostFields ).toBe( true );
		expect( getText( entries.Title, 'removed' ) ).toBe( 'Old' );
		expect( getText( entries.Title, 'added' ) ).toBe( 'New' );
	} );

	it( 'diffs the excerpt against the previous revision', () => {
		const { entries, hasChangedPostFields } = getFieldsDiffEntries(
			{ excerpt: { raw: 'A short summary' } },
			{ excerpt: { raw: 'A long summary' } }
		);

		expect( hasChangedPostFields ).toBe( true );
		expect( getText( entries.Excerpt, 'removed' ) ).toBe( 'long' );
		expect( getText( entries.Excerpt, 'added' ) ).toBe( 'short' );
	} );

	it( 'omits unchanged title and excerpt rows', () => {
		const { entries, hasChangedPostFields } = getFieldsDiffEntries(
			{
				title: { raw: 'Same' },
				excerpt: { raw: 'Same' },
				meta: { footer: 'text' },
			},
			{
				title: { raw: 'Same' },
				excerpt: { raw: 'Same' },
				meta: { footer: 'text' },
			}
		);

		expect( hasChangedPostFields ).toBe( false );
		expect( entries ).toEqual( { footer: expect.any( Array ) } );
	} );

	it( 'marks the whole title as added on the oldest revision', () => {
		const { entries } = getFieldsDiffEntries(
			{ title: { raw: 'First title' } },
			null
		);

		expect( getText( entries.Title, 'added' ) ).toBe( 'First title' );
		expect( getText( entries.Title, 'removed' ) ).toBe( '' );
	} );

	it( 'keeps non-empty meta values and skips empty ones', () => {
		const { entries, hasChangedPostFields } = getFieldsDiffEntries(
			{ meta: { kept: 'unchanged', emptyish: '[]' } },
			{ meta: { kept: 'unchanged', emptyish: '[]' } }
		);

		expect( hasChangedPostFields ).toBe( false );
		expect( entries ).toEqual( { kept: expect.any( Array ) } );
	} );

	it( 'returns no entries when fields are unchanged and meta is empty', () => {
		expect(
			getFieldsDiffEntries(
				{ title: { raw: 'Same' }, meta: {} },
				{ title: { raw: 'Same' }, meta: {} }
			)
		).toEqual( { entries: null, hasChangedPostFields: false } );
	} );
} );
