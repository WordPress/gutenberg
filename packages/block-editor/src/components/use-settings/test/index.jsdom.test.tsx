import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { useSetting } from '../';
import { store as blockEditorStore } from '../../../store';

describe( 'useSetting', () => {
	it( 'includes the migration hint in its deprecation warning', () => {
		const registry = createRegistry();
		registry.register( blockEditorStore );
		registry.dispatch( blockEditorStore ).updateSettings( {
			__experimentalFeatures: {
				typography: { dropCap: false },
			},
		} );

		const { result } = renderHook(
			() => useSetting( 'typography.dropCap' ),
			{
				wrapper: ( { children } ) => (
					<RegistryProvider value={ registry }>
						{ children }
					</RegistryProvider>
				),
			}
		);

		expect( result.current ).toBe( false );
		expect( console ).toHaveWarnedWith(
			'wp.blockEditor.useSetting is deprecated since version 6.5. Please use wp.blockEditor.useSettings instead. Note: The new useSettings function can retrieve multiple settings at once, with better performance.'
		);
	} );
} );
