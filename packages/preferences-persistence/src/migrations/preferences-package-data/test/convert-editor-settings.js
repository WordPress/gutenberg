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
} );
