import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MenuItem, SlotFillProvider } from '@wordpress/components';
import { createRegistry, RegistryProvider } from '@wordpress/data';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	ActionItem,
	ComplementaryAreaMoreMenuItem,
	store as interfaceStore,
} from '@wordpress/interface';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import PanelsMenu from '../panels-menu';
import MoreMenuItem from '../more-menu-item';
import { sidebars } from '../../sidebar/constants';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

function renderPanelsMenu( {
	activeArea = sidebars.document,
	hasOtherPanel = true,
	hasBlockSelection = false,
	isDistractionFree = false,
	extraItems,
	legacyHost = false,
}: {
	activeArea?: string;
	hasOtherPanel?: boolean;
	hasBlockSelection?: boolean;
	isDistractionFree?: boolean;
	extraItems?: ReactNode;
	legacyHost?: boolean;
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
						{ legacyHost ? (
							<ActionItem.Slot
								name="core/plugin-more-menu"
								fillProps={ { as: MoreMenuItem } }
							/>
						) : (
							<PanelsMenu />
						) }
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
				{ extraItems }
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
			screen.queryByRole( 'menuitemradio', { name: 'Inspector' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
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
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			).toBeChecked();
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
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
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			).not.toBeChecked();
			fireEvent.click(
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			);
			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'core' )
			).toBe( hasBlockSelection ? sidebars.block : sidebars.document );
			await openPanelsMenu( user );
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			).toBeChecked();
		}
	);

	it.each( [ sidebars.document, sidebars.block ] )(
		'keeps the %s Inspector tab open when its selected radio is activated',
		async ( activeArea ) => {
			const user = userEvent.setup();
			const { registry } = renderPanelsMenu( { activeArea } );
			await openPanelsMenu( user );
			fireEvent.click(
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			);
			expect(
				registry
					.select( interfaceStore )
					.getActiveComplementaryArea( 'core' )
			).toBe( activeArea );
			await openPanelsMenu( user );
			expect(
				screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
			).toBeChecked();
		}
	);

	it( 'keeps plugin panels selectable alongside Inspector', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu();
		await openPanelsMenu( user );
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
		);
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBe( 'plugin/sidebar' );
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
		).not.toBeChecked();
	} );
	it( 'keeps a plugin panel open when its selected radio is activated', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu( {
			activeArea: 'plugin/sidebar',
		} );
		await openPanelsMenu( user );
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
		);
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBe( 'plugin/sidebar' );
	} );

	it( 'retains checked checkbox toggles when the host does not opt into radios', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu( {
			activeArea: 'plugin/sidebar',
			legacyHost: true,
		} );
		await user.click( screen.getByRole( 'button', { name: 'Options' } ) );
		const item = await screen.findByRole( 'menuitemcheckbox', {
			name: 'Plugin panel',
		} );
		expect( item ).toBeChecked();
		await user.click( item );
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBeNull();
	} );

	it( 'uses the panel identifier even when a fill supplies another value', async () => {
		const user = userEvent.setup();
		renderPanelsMenu( {
			activeArea: 'plugin/another',
			extraItems: (
				<ComplementaryAreaMoreMenuItem
					scope="core"
					target="another"
					identifier="plugin/another"
					value="unrelated"
				>
					Another panel
				</ComplementaryAreaMoreMenuItem>
			),
		} );
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Another panel' } )
		).toBeChecked();
	} );

	it( 'opens Inspector when all panels are closed', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu();
		registry.dispatch( interfaceStore ).disableComplementaryArea( 'core' );
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: 'Plugin panel' } )
		).not.toBeChecked();
		fireEvent.click(
			screen.getByRole( 'menuitemradio', { name: 'Inspector' } )
		);
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBe( sidebars.document );
	} );

	it( 'preserves plugin actions, links, and independent checkboxes', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		renderPanelsMenu( {
			extraItems: (
				<>
					<ActionItem
						name="core/plugin-more-menu"
						onClick={ onClick }
					>
						Plugin action
					</ActionItem>
					<ActionItem
						name="core/plugin-more-menu"
						href="https://wordpress.org"
					>
						Plugin link
					</ActionItem>
					<ActionItem
						name="core/plugin-more-menu"
						role="menuitemcheckbox"
						aria-checked
						aria-controls="plugin-feature"
					>
						Plugin option
					</ActionItem>
				</>
			),
		} );
		await openPanelsMenu( user );
		expect(
			screen.getByRole( 'menuitem', { name: 'Plugin link' } )
		).toHaveAttribute( 'href', 'https://wordpress.org' );
		expect(
			screen.getByRole( 'menuitemcheckbox', { name: 'Plugin option' } )
		).toBeChecked();
		fireEvent.click(
			screen.getByRole( 'menuitem', { name: 'Plugin action' } )
		);
		expect( onClick ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'click' } )
		);
	} );
	it( 'keeps custom plugin panel items in the radio group', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		renderPanelsMenu( {
			activeArea: 'plugin/custom',
			extraItems: (
				<ActionItem
					name="core/plugin-more-menu"
					as={ MenuItem }
					role="menuitemradio"
					value="plugin/custom"
					onClick={ onClick }
				>
					Custom panel
				</ActionItem>
			),
		} );
		await openPanelsMenu( user );
		const item = screen.getByRole( 'menuitemradio', {
			name: 'Custom panel',
		} );
		expect( item ).toBeChecked();
		fireEvent.click( item );
		expect( onClick ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'click' } )
		);
	} );

	it( 'preserves explicit checkbox panel toggles', async () => {
		const user = userEvent.setup();
		const { registry } = renderPanelsMenu( {
			activeArea: 'plugin/sidebar',
			extraItems: (
				<ComplementaryAreaMoreMenuItem
					scope="core"
					target="legacy"
					identifier="plugin/sidebar"
					role="menuitemcheckbox"
				>
					Legacy toggle
				</ComplementaryAreaMoreMenuItem>
			),
		} );
		await openPanelsMenu( user );
		const item = screen.getByRole( 'menuitemcheckbox', {
			name: 'Legacy toggle',
		} );
		expect( item ).toBeChecked();
		fireEvent.click( item );
		expect(
			registry
				.select( interfaceStore )
				.getActiveComplementaryArea( 'core' )
		).toBeNull();
	} );
} );
