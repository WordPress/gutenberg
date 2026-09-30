import { describe, expect, it } from 'vitest';
import { mergeServerFields } from '../merge-server-fields';

const render = () => null;

describe( 'mergeServerFields', () => {
	it( 'appends the server fields to the client fields, in the server order', () => {
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

	it( 'replaces a client field with the server field of the same id, in its place', () => {
		const serverStatus = { id: 'status', label: 'State' };
		const fields = mergeServerFields(
			[
				{ id: 'status', label: 'Status', render },
				{ id: 'title', render },
			],
			[ { id: 'author' }, serverStatus ]
		);

		expect( fields ).toEqual( [
			serverStatus,
			{ id: 'title', render },
			{ id: 'author' },
		] );
	} );

	it( 'keeps the client fields when the server has none', () => {
		const clientFields = [ { id: 'title', render } ];

		expect( mergeServerFields( clientFields, [] ) ).toEqual( clientFields );
	} );
} );
