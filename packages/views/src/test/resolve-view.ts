import { describe, expect, it } from 'vitest';
import type { View } from '@wordpress/dataviews';
import {
	getApplicablePersistedView,
	getUserModifications,
	resolveView,
} from '../resolve-view';

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

// A preference may carry a `type` the screen no longer offers, because it
// predates the current `defaultLayouts` (a screen that used to offer the list
// layout, say). DataViews renders nothing for a type it is not given, so such a
// type is ignored and the layers below decide.
describe( 'persisted type the layouts do not offer', () => {
	const defaultView = { type: 'table', perPage: 20 } as unknown as View;
	const defaultLayouts = { table: { perPage: 50 }, grid: true as const };

	it( 'should resolve the type out of the layers below', () => {
		const view = resolveView( {
			defaultView,
			defaultLayouts,
			persistedView: { type: 'list' },
		} );
		expect( view.type ).toBe( 'table' );
		expect( view.perPage ).toBe( 50 );
	} );

	it( 'should keep the other persisted modifications', () => {
		const view = resolveView( {
			defaultView,
			defaultLayouts,
			persistedView: { type: 'list', perPage: 10 },
		} );
		expect( view ).toMatchObject( { type: 'table', perPage: 10 } );
	} );

	it( 'should prefer the type an override sets over the default view', () => {
		const view = resolveView( {
			defaultView,
			defaultLayouts,
			activeViewOverrides: { type: 'grid' },
			persistedView: { type: 'list' },
		} );
		expect( view.type ).toBe( 'grid' );
	} );

	it( 'should honor a persisted type with a `true` layout entry', () => {
		const view = resolveView( {
			defaultView,
			defaultLayouts,
			persistedView: { type: 'grid' },
		} );
		expect( view.type ).toBe( 'grid' );
	} );

	it( 'should honor any persisted type without default layouts', () => {
		const view = resolveView( {
			defaultView,
			persistedView: { type: 'list' },
		} );
		expect( view.type ).toBe( 'list' );
	} );

	it( 'should not carry the type over to the next modifications', () => {
		const layers = {
			defaultView,
			defaultLayouts,
			persistedView: { type: 'list' as const },
		};
		const view = resolveView( layers );
		expect( getUserModifications( view, layers ) ).toBeUndefined();
		expect(
			getUserModifications( { ...view, perPage: 10 } as View, layers )
		).toEqual( { perPage: 10 } );
	} );

	describe( 'getApplicablePersistedView', () => {
		it( 'should drop the type and keep the rest', () => {
			expect(
				getApplicablePersistedView(
					{ type: 'list', perPage: 10 },
					defaultLayouts
				)
			).toEqual( { perPage: 10 } );
		} );

		it( 'should return `undefined` when the type was the only modification', () => {
			expect(
				getApplicablePersistedView( { type: 'list' }, defaultLayouts )
			).toBeUndefined();
		} );

		it( 'should return the preference as is when its type is offered', () => {
			const persistedView = { type: 'grid' as const, perPage: 10 };
			expect(
				getApplicablePersistedView( persistedView, defaultLayouts )
			).toBe( persistedView );
		} );

		it( 'should return the preference as is without default layouts', () => {
			const persistedView = { type: 'list' as const };
			expect(
				getApplicablePersistedView( persistedView, undefined )
			).toBe( persistedView );
		} );
	} );
} );
