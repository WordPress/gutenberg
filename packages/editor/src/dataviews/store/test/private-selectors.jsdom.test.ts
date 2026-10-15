import { describe, expect, it, vi } from 'vitest';
import reducer from '../reducer';
import { registerEntityField, unregisterEntityField } from '../private-actions';
import { getEntityFields, getEntityPluginFields } from '../private-selectors';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const slug = { id: 'slug', label: 'Slug' };
const rating = { id: 'rating', label: 'Rating' };

function reduce( ...actions: any[] ) {
	return actions.reduce(
		( state, action ) => reducer( state, action ),
		reducer( undefined, { type: '@@INIT' } as any )
	);
}

describe( 'getEntityPluginFields', () => {
	it( 'leaves out the default fields the editor registers', () => {
		const state = reduce(
			registerEntityField( 'postType', 'page', slug, {
				isDefault: true,
			} ),
			registerEntityField( 'postType', 'page', rating )
		);

		expect( getEntityFields( state, 'postType', 'page' ) ).toEqual( [
			slug,
			rating,
		] );
		expect( getEntityPluginFields( state, 'postType', 'page' ) ).toEqual( [
			rating,
		] );
	} );

	it( 'returns the same list until the fields change', () => {
		const state = reduce(
			registerEntityField( 'postType', 'page', slug, {
				isDefault: true,
			} ),
			registerEntityField( 'postType', 'page', rating )
		);

		expect( getEntityPluginFields( state, 'postType', 'page' ) ).toBe(
			getEntityPluginFields( state, 'postType', 'page' )
		);
	} );

	it( 'treats a default field a plugin registers again as the plugin one', () => {
		const pluginSlug = { id: 'slug', label: 'Permalink' };
		const state = reduce(
			registerEntityField( 'postType', 'page', slug, {
				isDefault: true,
			} ),
			registerEntityField( 'postType', 'page', pluginSlug )
		);

		expect( getEntityPluginFields( state, 'postType', 'page' ) ).toEqual( [
			pluginSlug,
		] );
	} );

	it( 'forgets an unregistered field', () => {
		const state = reduce(
			registerEntityField( 'postType', 'page', slug, {
				isDefault: true,
			} ),
			unregisterEntityField( 'postType', 'page', 'slug' ),
			registerEntityField( 'postType', 'page', slug )
		);

		expect( getEntityPluginFields( state, 'postType', 'page' ) ).toEqual( [
			slug,
		] );
	} );

	it( 'returns an empty list for an entity without fields', () => {
		const state = reduce();

		expect( getEntityPluginFields( state, 'postType', 'page' ) ).toEqual(
			[]
		);
	} );
} );
