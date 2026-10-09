import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Popover from '../../popover';
import * as Menu from '../../menu';
import * as Tooltip from '../../tooltip';
import * as Select from '../../form/primitives/select';
import * as Autocomplete from '../../form/primitives/autocomplete';
import * as Combobox from '../../form/primitives/combobox';
import {
	getWpCompatOverlaySlot,
	__resetWpCompatOverlaySlotCacheForTests,
} from '../wp-compat-overlay-slot';

beforeEach( () => {
	vi.stubGlobal( '__wpUiCompatOverlaySlotEnabled', true );
} );

afterEach( () => {
	getWpCompatOverlaySlot()?.remove();
	__resetWpCompatOverlaySlotCacheForTests();
	vi.unstubAllGlobals();
} );

async function openTooltip( user: ReturnType< typeof userEvent.setup > ) {
	const trigger = screen.getByRole( 'button', { name: 'Open Tooltip' } );
	await user.hover( trigger );
	await waitFor( () => {
		expect( trigger ).toHaveAttribute( 'data-popup-open' );
	} );
}

describe.each( [
	[
		'Popover',
		( container: HTMLElement | null ) => (
			<Popover.Root defaultOpen>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<div data-testid="portal-target" />
				<Popover.Popup
					portal={ <Popover.Portal container={ container } /> }
				>
					<Popover.Title>Popover title</Popover.Title>
					Portal content
				</Popover.Popup>
			</Popover.Root>
		),
	],
	[
		'Menu',
		( container: HTMLElement | null ) => (
			<Menu.Root defaultOpen>
				<Menu.Trigger>Open Menu</Menu.Trigger>
				<div data-testid="portal-target" />
				<Menu.Popup portal={ <Menu.Portal container={ container } /> }>
					Portal content
				</Menu.Popup>
			</Menu.Root>
		),
	],
	[
		'Tooltip',
		( container: HTMLElement | null ) => (
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger>Open Tooltip</Tooltip.Trigger>
					<div data-testid="portal-target" />
					<Tooltip.Popup
						portal={ <Tooltip.Portal container={ container } /> }
					>
						Portal content
					</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		),
	],
	[
		'Select',
		( container: HTMLElement | null ) => (
			<Select.Root defaultOpen>
				<Select.Trigger>Open Select</Select.Trigger>
				<div data-testid="portal-target" />
				<Select.Popup
					portal={ <Select.Portal container={ container } /> }
				>
					Portal content
				</Select.Popup>
			</Select.Root>
		),
	],
	[
		'Autocomplete',
		( container: HTMLElement | null ) => (
			<Autocomplete.Root defaultOpen>
				<Autocomplete.Input aria-label="Search" />
				<div data-testid="portal-target" />
				<Autocomplete.Popup
					portal={ <Autocomplete.Portal container={ container } /> }
				>
					Portal content
				</Autocomplete.Popup>
			</Autocomplete.Root>
		),
	],
	[
		'Combobox',
		( container: HTMLElement | null ) => (
			<Combobox.Root defaultOpen>
				<Combobox.Input aria-label="Search" />
				<div data-testid="portal-target" />
				<Combobox.Popup
					portal={ <Combobox.Portal container={ container } /> }
				>
					Portal content
				</Combobox.Popup>
			</Combobox.Root>
		),
	],
] as const )( '%s.Portal', ( _name, content ) => {
	it( 'waits for an explicit null container to become available', async () => {
		const user = userEvent.setup();
		const { rerender } = render( content( null ) );

		if ( _name === 'Tooltip' ) {
			await openTooltip( user );
		}

		expect(
			screen.queryByText( 'Portal content' )
		).not.toBeInTheDocument();

		const target = screen.getByTestId( 'portal-target' );
		rerender( content( target ) );

		await waitFor( () => {
			expect(
				within( target ).getByText( 'Portal content' )
			).toBeVisible();
		} );
	} );
} );
