import { describe, expect, it } from 'vitest';
import convertEditorSettings from '../convert-editor-settings';

describe( 'convertEditorSettings', () => {
	it( 'converts the `allowRightClickOverrides` property', () => {
		const input = {
			'core/edit-post': {
				allowRightClickOverrides: false,
			},
		};

		const expectedOutput = {
			core: {
				allowRightClickOverrides: false,
			},
		};

		expect( convertEditorSettings( input ) ).toEqual( expectedOutput );
	} );

	it( 'does not mutate its input', () => {
		const input = {
			'core/edit-post': { fixedToolbar: true, other: 1 },
			'core/edit-site': { fixedToolbar: true },
		};
		const snapshot = structuredClone( input );

		expect( convertEditorSettings( input ) ).toEqual( {
			core: { fixedToolbar: true },
			'core/edit-post': { other: 1 },
		} );
		expect( input ).toEqual( snapshot );
	} );

	it.each( [ [ 'abc' ], [ [] ], [ null ], [ {} ] ] )(
		'removes an editor scope that is %j',
		( scope ) => {
			expect(
				convertEditorSettings( {
					// @ts-expect-error String, array, and null are not valid ScopePreferences objects; invalid scopes are removed.
					'core/edit-post': scope,
					// @ts-expect-error String, array, and null are not valid ScopePreferences objects; invalid scopes are removed.
					'core/edit-site': scope,
				} )
			).toEqual( {} );
		}
	);

	it( 'replaces a `core` scope that is not an object', () => {
		expect(
			convertEditorSettings( {
				// @ts-expect-error 'abc' is not a ScopePreferences object; an invalid core scope is replaced.
				core: 'abc',
				'core/edit-post': { fixedToolbar: true },
			} )
		).toEqual( { core: { fixedToolbar: true } } );
	} );
} );
