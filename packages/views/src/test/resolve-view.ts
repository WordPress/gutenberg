/**
 * WordPress dependencies
 */
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { getUserModifications, resolveView } from '../resolve-view';

const LOCKED = {
	field: 'author',
	operator: 'is',
	value: 'admin',
	isLocked: true,
} as const;

const STATUS = {
	field: 'status',
	operator: 'is',
	value: 'draft',
} as const;

// The layer resolution itself is covered by the `useView` tests. What is left
// here is the handling of locked filters: they are not the user's to change, so
// they are pinned on every read and never persisted — a preference is shared by
// every view of the same entity, and only some of them lock the filter.
describe( 'locked filters', () => {
	const defaultView = { type: 'table', filters: [] } as unknown as View;
	const activeViewOverrides = { filters: [ LOCKED ] };

	it( 'should pin the locked filters an override provides', () => {
		const view = resolveView( {
			defaultView,
			activeViewOverrides,
		} );
		expect( view.filters ).toEqual( [ LOCKED ] );
	} );

	it( 'should keep them pinned over the persisted filters', () => {
		const view = resolveView( {
			defaultView,
			activeViewOverrides,
			persistedView: { filters: [ STATUS ] },
		} );
		expect( view.filters ).toEqual( [ LOCKED, STATUS ] );
	} );

	it( 'should not persist them alongside the filters the user added', () => {
		const view = resolveView( {
			defaultView,
			activeViewOverrides,
		} );
		const modifications = getUserModifications(
			{ ...view, filters: [ LOCKED, STATUS ] } as View,
			{ defaultView, activeViewOverrides }
		);
		expect( modifications ).toEqual( { filters: [ STATUS ] } );
	} );

	it( 'should not count them as a modification on their own', () => {
		const view = resolveView( {
			defaultView,
			activeViewOverrides,
		} );
		expect(
			getUserModifications( view, { defaultView, activeViewOverrides } )
		).toBeUndefined();
	} );
} );
