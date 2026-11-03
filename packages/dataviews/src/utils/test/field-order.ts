import { describe, expect, it } from 'vitest';
import { applyFieldOrder, getFieldOrder } from '../field-order';
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

const fields = [
	field( 'title' ),
	field( 'status' ),
	field( 'author' ),
	field( 'date' ),
	field( 'tags' ),
	field( 'comments' ),
];

const base: View = { type: 'table', titleField: 'title' };

describe( 'getFieldOrder', () => {
	it( 'lists visible fields in table order, then hidden ones alphabetically, when the view has no order yet', () => {
		const view = { ...base, fields: [ 'status', 'author' ] };

		expect( getFieldOrder( view, fields ) ).toEqual( [
			'status',
			'author',
			'comments',
			'date',
			'tags',
		] );
	} );

	it( 'keeps hidden fields where the order puts them', () => {
		const view = {
			...base,
			fields: [ 'author', 'date' ],
			fieldOrder: [ 'author', 'comments', 'date', 'tags', 'status' ],
		};

		expect( getFieldOrder( view, fields ) ).toEqual( [
			'author',
			'comments',
			'date',
			'tags',
			'status',
		] );
	} );

	it( 'follows `fields` for visible fields, so a move from the header menu shows up', () => {
		// Header "Move right" on Author swapped the two visible columns.
		const view = {
			...base,
			fields: [ 'date', 'author' ],
			fieldOrder: [ 'author', 'comments', 'date', 'tags', 'status' ],
		};

		expect( getFieldOrder( view, fields ) ).toEqual( [
			'date',
			'comments',
			'author',
			'tags',
			'status',
		] );
	} );

	it( 'adds fields the order does not know about yet, and drops ones that no longer exist', () => {
		const view = {
			...base,
			fields: [ 'author', 'tags' ],
			fieldOrder: [ 'gone', 'author', 'date' ],
		};

		expect( getFieldOrder( view, fields ) ).toEqual( [
			'author',
			'date',
			'tags',
			'comments',
			'status',
		] );
	} );

	it( 'leaves out the fields that are not hideable', () => {
		const view = {
			...base,
			fields: [ 'author' ],
			fieldOrder: [ 'title', 'author' ],
		};

		expect(
			getFieldOrder( view, [ field( 'title' ), field( 'author' ) ] )
		).toEqual( [ 'author' ] );
	} );
} );

describe( 'applyFieldOrder', () => {
	const order = [ 'author', 'comments', 'date', 'tags', 'status' ];

	it( 'shows a field at its place in the order, not at the end', () => {
		const view = { ...base, fields: [ 'author', 'date', 'status' ] };

		expect(
			applyFieldOrder( view, order, [
				'author',
				'date',
				'status',
				'tags',
			] )
		).toMatchObject( {
			fields: [ 'author', 'date', 'tags', 'status' ],
			fieldOrder: order,
		} );
	} );

	it( 'remembers where a field was when it is hidden', () => {
		const view = { ...base, fields: [ 'author', 'date', 'status' ] };

		expect(
			applyFieldOrder( view, order, [ 'author', 'status' ] )
		).toMatchObject( {
			fields: [ 'author', 'status' ],
			fieldOrder: order,
		} );
	} );

	it( 'keeps fields it does not manage next to the field they followed', () => {
		const view = { ...base, fields: [ 'pinned', 'author', 'id', 'date' ] };

		expect(
			applyFieldOrder( view, [ 'date', 'author' ], [ 'author', 'date' ] )
				.fields
		).toEqual( [ 'pinned', 'date', 'author', 'id' ] );
	} );
} );
