/**
 * Internal dependencies
 */
import clearUnchangedEdits from '../clear-unchanged-edits';

describe( 'clearUnchangedEdits', () => {
	it( 'sets edits matching the persisted record to undefined', () => {
		const result = clearUnchangedEdits(
			{ title: 'Hello', status: 'draft' },
			{ title: 'Hello', status: 'publish' }
		);

		expect( result ).toEqual( { title: undefined, status: 'draft' } );
	} );

	it( 'unwraps the persisted value from its `raw` subfield', () => {
		const result = clearUnchangedEdits(
			{ title: 'Hello', content: 'World' },
			{
				title: { raw: 'Hello', rendered: '<p>Hello</p>' },
				content: { raw: 'Changed', rendered: '<p>Changed</p>' },
			}
		);

		expect( result ).toEqual( { title: undefined, content: 'World' } );
	} );

	it( 'compares deeply for object values', () => {
		const result = clearUnchangedEdits(
			{ meta: { a: 1 }, other: { b: 1 } },
			{ meta: { a: 1 }, other: { b: 2 } }
		);

		expect( result ).toEqual( { meta: undefined, other: { b: 1 } } );
	} );

	it( 'keeps all edits when there is no persisted record', () => {
		const result = clearUnchangedEdits( { title: 'Hello' }, undefined );

		expect( result ).toEqual( { title: 'Hello' } );
	} );
} );
