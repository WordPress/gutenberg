import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import useNestedSettingsUpdate from '../use-nested-settings-update';

type TestWindow = Window & {
	__experimentalEnableGridInteractivity?: boolean;
};

/**
 * Gets the block list settings a container ends up with.
 *
 * @param options                 Options.
 * @param options.captureToolbars Whether the block captures toolbars.
 * @param options.layout          The container's layout.
 *
 * @return The block list settings.
 */
async function getSettings( {
	captureToolbars,
	layout,
}: {
	captureToolbars: boolean | undefined;
	layout: Record< string, unknown >;
} ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	renderHook(
		() =>
			useNestedSettingsUpdate(
				'container',
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				undefined,
				captureToolbars,
				undefined,
				layout
			),
		{
			wrapper: ( { children }: { children: ReactNode } ) =>
				createElement(
					RegistryProvider,
					{ value: registry },
					children
				),
		}
	);
	// The settings are written in a batch, after the render.
	await waitFor( () =>
		expect(
			registry
				.select( blockEditorStore )
				.getBlockListSettings( 'container' )
		).toBeDefined()
	);
	// The wait above makes sure the settings are there.
	return registry
		.select( blockEditorStore )
		.getBlockListSettings( 'container' )!;
}

describe( 'useNestedSettingsUpdate', () => {
	let originalExperiment: boolean | undefined;
	beforeEach( () => {
		originalExperiment = ( window as TestWindow )
			.__experimentalEnableGridInteractivity;
		( window as TestWindow ).__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		( window as TestWindow ).__experimentalEnableGridInteractivity =
			originalExperiment;
	} );

	it( "captures toolbars when the layout does and the block doesn't say", async () => {
		const settings = await getSettings( {
			captureToolbars: undefined,
			layout: { type: 'grid', isManualPlacement: true },
		} );
		expect( settings.__experimentalCaptureToolbars ).toBe( true );
	} );

	it( "doesn't capture toolbars when the block says not to, whatever its layout", async () => {
		const settings = await getSettings( {
			captureToolbars: false,
			layout: { type: 'grid', isManualPlacement: true },
		} );
		expect( settings.__experimentalCaptureToolbars ).toBe( false );
	} );

	it( 'captures toolbars when the block does', async () => {
		const settings = await getSettings( {
			captureToolbars: true,
			layout: { type: 'grid' },
		} );
		expect( settings.__experimentalCaptureToolbars ).toBe( true );
	} );

	it( "doesn't capture toolbars when neither the block nor the layout does", async () => {
		const settings = await getSettings( {
			captureToolbars: false,
			layout: { type: 'grid' },
		} );
		expect( settings.__experimentalCaptureToolbars ).toBe( false );
	} );
} );
