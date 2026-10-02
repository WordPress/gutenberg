import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlotFillProvider } from '@wordpress/components';
import { createRegistry, RegistryProvider } from '@wordpress/data';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	ComplementaryAreaMoreMenuItem,
	store as interfaceStore,
} from '@wordpress/interface';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import PanelsMenu from '../panels-menu';
import { sidebars } from '../../sidebar/constants';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

function renderPanelsMenu( {
	activeArea = sidebars.document,
	hasOtherPanel = true,
	hasBlockSelection = false,
	isDistractionFree = false,
} = {} ) {
	const registry = createRegistry();
	registry.register( preferencesStore );
	registry.register( interfaceStore );
	registry.register( blockEditorStore );
	registry
		.dispatch( preferencesStore )
		.set( 'core', 'distractionFree', isDistractionFree );
	registry
		.dispatch( interfaceStore )
		.enableComplementaryArea( 'core', activeArea );
	if ( hasBlockSelection ) {
		registry.dispatch( blockEditorStore ).selectBlock( 'selected-block' );
	}

	render(
		<RegistryProvider value={ registry }>
			<SlotFillProvider>
				<Menu.Root>
					<Menu.Trigger>Options</Menu.Trigger>
					<Menu.Popup>
						<Menu.Item>
							<Menu.ItemLabel>Other option</Menu.ItemLabel>
						</Menu.Item>
						<PanelsMenu />
					</Menu.Popup>
				</Menu.Root>
				{ hasOtherPanel && (
					<ComplementaryAreaMoreMenuItem
						scope="core"
						target="sidebar"
						identifier="plugin/sidebar"
					>
						Plugin panel
					</ComplementaryAreaMoreMenuItem>
				) }
			</SlotFillProvider>
		</RegistryProvider>
	);
	return { registry };
}

async function openPanelsMenu( user: ReturnType< typeof userEvent.setup > ) {
	await user.click( screen.getByRole( 'button', { name: 'Options' } ) );
	await user.click(
		await screen.findByRole( 'menuitem', { name: 'Panels' } )
	);
	await screen.findByRole( 'menu', { name: 'Panels' } );
}

describe( 'Panels menu', () => {
	it( 'omits Inspector while distraction-free mode hides sidebars', async () => {
		const user = userEvent.setup();
		renderPanelsMenu( { isDistractionFree: true } );
		await openPanelsMenu( user );
		expect(
			screen.queryByRole( 'menuitemcheckbox', { name: 'Inspector' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Plugin panel' } )
		).toBeVisible();
	} );

	it( 'hides the submenu when Inspector is the only panel', async () => {
		const user = userEvent.setup();
		renderPanelsMenu( { hasOtherPanel: false } );
		await user.click( screen.getByRole( 'button', { name: 'Options' } ) );
		expect(
			await screen.findByRole( 'menuitem', { name: 'Other option' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Panels' } )
		).not.toBeInTheDocument();
	} );

	it.each( [ sidebars.document, sidebars.block ] )(
		'checks Inspector when its %s tab is open',
		async ( activeArea ) => {
			const user = userEvent.setup();
			renderPanelsMenu( { activeArea } );
			await openPanelsMenu( user );
			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Plugin panel' } )
			).not.toBeChecked();
		}
	);

	it.each( [ false, true ] )(
		'opens Inspector from another panel with block selection %s',
		async ( hasBlockSelection ) => {
			const user = userEvent.setup();
			const { registry } = renderPanelsMenu( {
				activeArea: 'plugin/sidebar',
				hasBlockSelection,
			} );
			await openPanelsMenu( user );
			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
			).not.toBeChecked();
			fireEvent.click(
				screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
			);
			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'core' )
			).toBe( hasBlockSelection ? sidebars.block : sidebars.document );
			await openPanelsMenu( user );
			expect(
				screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
			).toBeChecked();
		}
	);

	it( 'closes Inspector when its checked item is activated', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu();
		await openPanelsMenu( user );
		fireEvent.click(
			screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
		);
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBeNull();
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
		).not.toBeChecked();
	} );

	it( 'keeps plugin panels selectable alongside Inspector', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu();
		await openPanelsMenu( user );
		fireEvent.click(
			screen.getByRole( 'menuitemcheckbox', { name: 'Plugin panel' } )
		);
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBe( 'plugin/sidebar' );
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Plugin panel' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Inspector' } )
		).not.toBeChecked();
	} );
} );
