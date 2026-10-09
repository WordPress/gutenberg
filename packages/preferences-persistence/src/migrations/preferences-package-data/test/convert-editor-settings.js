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
} );
