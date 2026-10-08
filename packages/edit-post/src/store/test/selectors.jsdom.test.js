import { describe, expect, it, vi } from 'vitest';
import {
	hasMetaBoxes,
	isSavingMetaBoxes,
	getActiveMetaBoxLocations,
	isMetaBoxLocationActive,
	isMetaBoxLocationVisible,
} from '../selectors';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'selectors', () => {
	describe( 'hasMetaBoxes', () => {
		it( 'should return true if there are active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if there are no active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			expect( hasMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'isSavingMetaBoxes', () => {
		it( 'should return true if some meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: true,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( true );
		} );

		it( 'should return false if no meta boxes are saving', () => {
			const state = {
				metaBoxes: {
					isSaving: false,
					locations: {},
				},
			};

			expect( isSavingMetaBoxes( state ) ).toBe( false );
		} );
	} );

	describe( 'getActiveMetaBoxLocations', () => {
		it( 'should return the active meta boxes', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
						normal: [],
					},
				},
			};

			const result = getActiveMetaBoxLocations( state, 'side' );

			expect( result ).toEqual( [ 'side' ] );
		} );
	} );

	describe( 'isMetaBoxLocationActive', () => {
		it( 'should return false if not active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( false );
		} );

		it( 'should return true if active', () => {
			const state = {
				metaBoxes: {
					locations: {
						side: [ 'postcustom' ],
					},
				},
			};

			const result = isMetaBoxLocationActive( state, 'side' );

			expect( result ).toBe( true );
		} );
	} );

	describe( 'isMetaBoxLocationVisible', () => {
		const state = {
			metaBoxes: {
				locations: {
					side: [ { id: 'side-box' } ],
					normal: [],
					advanced: [ { id: 'advanced-box' } ],
				},
			},
		};

		const withEnabledPanels = ( enabled ) => {
			isMetaBoxLocationVisible.registry = {
				select: () => ( {
					isEditorPanelEnabled: ( name ) => enabled.includes( name ),
				} ),
			};
		};

		it( 'should return false for a location without meta boxes', () => {
			withEnabledPanels( [ 'meta-box-side-box' ] );

			expect( isMetaBoxLocationVisible( state, 'normal' ) ).toBe( false );
		} );

		it( 'should return false when only the side location has visible meta boxes', () => {
			withEnabledPanels( [ 'meta-box-side-box' ] );

			expect( isMetaBoxLocationVisible( state, 'side' ) ).toBe( true );
			expect( isMetaBoxLocationVisible( state, 'normal' ) ).toBe( false );
			expect( isMetaBoxLocationVisible( state, 'advanced' ) ).toBe(
				false
			);
		} );

		it( 'should return true when a meta box in the location is enabled', () => {
			withEnabledPanels( [ 'meta-box-advanced-box' ] );

			expect( isMetaBoxLocationVisible( state, 'advanced' ) ).toBe(
				true
			);
		} );
	} );
} );
