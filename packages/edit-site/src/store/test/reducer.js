/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { settings, editedPost } from '../reducer';

describe( 'state', () => {
	describe( 'settings()', () => {
		it( 'should apply default state', () => {
			expect( settings( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should default to returning the same state', () => {
			const state = {};
			expect( settings( state, {} ) ).toBe( state );
		} );

		it( 'should update settings with a shallow merge', () => {
			expect(
				settings(
					deepFreeze( {
						setting: { key: 'value' },
						otherSetting: 'value',
					} ),
					{
						type: 'UPDATE_SETTINGS',
						settings: { setting: { newKey: 'newValue' } },
					}
				)
			).toEqual( {
				setting: { newKey: 'newValue' },
				otherSetting: 'value',
			} );
		} );
	} );

	describe( 'editedPost()', () => {
		it( 'should apply default state', () => {
			expect( editedPost( undefined, {} ) ).toEqual( {} );
		} );

		it( 'should default to returning the same state', () => {
			const state = [];
			expect( editedPost( state, {} ) ).toBe( state );
		} );

		it( 'should update when a template is set', () => {
			expect(
				editedPost(
					{ id: 1, type: 'wp_template' },
					{
						type: 'SET_EDITED_POST',
						postType: 'wp_template',
						id: 2,
						context: { templateSlug: 'slug' },
					}
				)
			).toEqual( {
				postType: 'wp_template',
				id: 2,
				context: { templateSlug: 'slug' },
			} );
		} );
	} );
} );
