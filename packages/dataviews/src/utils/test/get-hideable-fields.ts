import { describe, expect, it } from 'vitest';
import getHideableFields from '../get-hideable-fields';
import type { NormalizedField, View } from '../../types';

type Item = Record< string, unknown >;

function field(
	id: string,
	props: Partial< NormalizedField< Item > > = {}
): NormalizedField< Item > {
	return {
		id,
		label: id,
		...props,
	} as NormalizedField< Item >;
}

const view: View = { type: 'table', titleField: 'title' };

describe( 'getHideableFields', () => {
	it( 'sorts the fields alphabetically by label, not by declaration order', () => {
		const fields = [
			field( 'date', { label: 'Date' } ),
			field( 'author', { label: 'Author' } ),
			field( 'comments', { label: 'Comments' } ),
		];

		expect(
			getHideableFields( view, fields ).map( ( f ) => f.id )
		).toEqual( [ 'author', 'comments', 'date' ] );
	} );

	it( 'leaves out the fields the user cannot show or hide', () => {
		const fields = [
			field( 'title', { label: 'Title' } ),
			field( 'featured_media', {
				label: 'Featured image',
				type: 'media',
			} ),
			field( 'slug', { label: 'Slug', enableHiding: false } ),
			field( 'author', { label: 'Author' } ),
		];

		expect(
			getHideableFields( view, fields ).map( ( f ) => f.id )
		).toEqual( [ 'author' ] );
	} );

	it( 'does not mutate the fields it receives', () => {
		const fields = [
			field( 'date', { label: 'Date' } ),
			field( 'author', { label: 'Author' } ),
		];

		getHideableFields( view, fields );

		expect( fields.map( ( f ) => f.id ) ).toEqual( [ 'date', 'author' ] );
	} );
} );
