import { describe, expect, it } from 'vitest';
import type { Field } from '@wordpress/dataviews';
import { mergeServerFields } from '../merge-server-fields';

const render = () => null;

describe( 'mergeServerFields', () => {
	it( 'places the server fields where the client lists their ids', () => {
		const fields = mergeServerFields(
			[ 'date_added', { id: 'filename', render }, 'notes' ],
			[
				{ id: 'notes', label: 'Notes' },
				{ id: 'date_added', label: 'Date added' },
			]
		);

		expect( fields.map( ( { id } ) => id ) ).toEqual( [
			'date_added',
			'filename',
			'notes',
		] );
	} );

	it( 'drops the ids the server does not list', () => {
		const fields = mergeServerFields(
			[ 'author', { id: 'title', render } ],
			[]
		);

		expect( fields.map( ( { id } ) => id ) ).toEqual( [ 'title' ] );
	} );

	it( 'merges the server data into a client field with the same id', () => {
		const fields = mergeServerFields(
			[ { id: 'status', label: 'Status', render } ],
			[ { id: 'status', label: 'State' } ]
		);

		expect( fields ).toEqual( [
			{ id: 'status', label: 'State', render },
		] );
	} );

	it( 'lets a placed server field take the place of a later client field with the same id', () => {
		const templateAuthor: Field< any > = { id: 'author', render };
		const serverAuthor: Field< any > = { id: 'author', label: 'Author' };

		expect(
			mergeServerFields( [ 'author', templateAuthor ], [ serverAuthor ] )
		).toEqual( [ serverAuthor ] );
		expect( mergeServerFields( [ 'author', templateAuthor ], [] ) ).toEqual(
			[ templateAuthor ]
		);
	} );

	it( 'appends the server fields the client does not know, in the server order', () => {
		const fields = mergeServerFields(
			[ { id: 'title', render } ],
			[ { id: 'acme/b' }, { id: 'acme/a' } ]
		);

		expect( fields.map( ( { id } ) => id ) ).toEqual( [
			'title',
			'acme/b',
			'acme/a',
		] );
	} );
} );
