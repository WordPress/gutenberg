import { describe, expect, it } from 'vitest';
import type { View } from '@wordpress/dataviews';
import { viewToQuery } from '../view-utils';

describe( 'viewToQuery', () => {
	it( 'translates a locked "used is false" filter to `used=false` and requests the field', () => {
		const view = {
			type: 'table',
			filters: [
				{
					field: 'used',
					operator: 'is',
					value: false,
					isLocked: true,
				},
			],
		} as unknown as View;

		const query = viewToQuery( view, 'attachment' );
		expect( query.used ).toBe( false );
		expect( query.include_used ).toBe( true );
	} );

	it( 'translates a "used is true" filter to `used=true`', () => {
		const view = {
			type: 'table',
			filters: [
				{
					field: 'used',
					operator: 'is',
					value: true,
				},
			],
		} as unknown as View;

		expect( viewToQuery( view, 'attachment' ).used ).toBe( true );
	} );

	it( 'translates a "used is not false" filter to `used=true`', () => {
		const view = {
			type: 'table',
			filters: [
				{
					field: 'used',
					operator: 'isNot',
					value: false,
				},
			],
		} as unknown as View;

		expect( viewToQuery( view, 'attachment' ).used ).toBe( true );
	} );

	it( 'requests the field when the "used" column is visible, without filtering', () => {
		const view = {
			type: 'table',
			filters: [],
			fields: [ 'used' ],
		} as unknown as View;

		const query = viewToQuery( view, 'attachment' );
		expect( query.include_used ).toBe( true );
		expect( query ).not.toHaveProperty( 'used' );
	} );

	it( 'omits `used` when no usage filter is set', () => {
		const view = {
			type: 'table',
			filters: [],
		} as unknown as View;

		expect( viewToQuery( view, 'attachment' ) ).not.toHaveProperty(
			'used'
		);
	} );

	it( 'keeps the attachment status and embed defaults', () => {
		const view = { type: 'table', filters: [] } as unknown as View;

		const query = viewToQuery( view, 'attachment' );
		expect( query.status ).toBe( 'inherit' );
		expect( query._embed ).toBe( 'wp:attached-to' );
	} );
} );
