import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import type { CSSProperties, RefObject } from 'react';
import { createRef } from '@wordpress/element';
import * as Menu from '../../menu';
import * as Select from '../../form/primitives/select';
import * as Combobox from '../../form/primitives/combobox';
import * as Autocomplete from '../../form/primitives/autocomplete';
import type { ItemPopupWidth } from '../css/item-popup';
import '../../../../theme/prebuilt/css/design-tokens.css';

const LONG_LABEL =
	'A long item label that needs more space than the popup width preset allows. '.repeat(
		8
	);

let initialViewport: { width: number; height: number };

beforeAll( async () => {
	initialViewport = { width: window.innerWidth, height: window.innerHeight };
	await page.viewport( 1000, 800 );
} );

afterAll( async () => {
	await page.viewport( initialViewport.width, initialViewport.height );
} );

function MenuExample( {
	width,
	label = 'Save',
	style,
}: {
	width?: ItemPopupWidth;
	label?: string;
	style?: CSSProperties;
} ) {
	return (
		<Menu.Root defaultOpen modal={ false }>
			<Menu.Trigger>Actions</Menu.Trigger>
			<Menu.Popup width={ width } style={ style }>
				<Menu.Item>
					<Menu.ItemLabel>{ label }</Menu.ItemLabel>
				</Menu.Item>
			</Menu.Popup>
		</Menu.Root>
	);
}

describe( 'Menu popup widths', () => {
	describe.each( [
		{ width: 'sm', maximum: 320 },
		{ width: 'md', maximum: 400 },
		{ width: 'lg', maximum: 560 },
	] as const )( '$width preset', ( { width, maximum } ) => {
		it( 'sizes short content below the maximum', async () => {
			await render( <MenuExample width={ width } /> );
			await expect
				.poll(
					() =>
						screen.getByRole( 'menu' ).getBoundingClientRect().width
				)
				.toBeLessThan( maximum );
		} );
		it( 'caps long content at the maximum', async () => {
			await render(
				<MenuExample width={ width } label={ LONG_LABEL } />
			);
			await expect
				.poll(
					() =>
						screen.getByRole( 'menu' ).getBoundingClientRect().width
				)
				.toBe( maximum );
		} );
	} );

	it.each( [
		{ name: 'default maximum', style: undefined, width: 320 },
		{
			name: 'consumer maximum override',
			style: { '--wp-ui-menu-max-width': '240px' } as CSSProperties,
			width: 240,
		},
		{ name: 'consumer fixed width', style: { width: 220 }, width: 220 },
	] )( 'keeps the $name', async ( { style, width } ) => {
		await render( <MenuExample label={ LONG_LABEL } style={ style } /> );
		await expect
			.poll(
				() => screen.getByRole( 'menu' ).getBoundingClientRect().width
			)
			.toBe( width );
	} );

	it( 'keeps the minimum width for short content', async () => {
		await render( <MenuExample /> );
		await expect
			.poll(
				() => screen.getByRole( 'menu' ).getBoundingClientRect().width
			)
			.toBe( 160 );
	} );

	it( 'caps presets at the available viewport width', async () => {
		await page.viewport( 280, 800 );
		const view = await render(
			<MenuExample width="lg" label={ LONG_LABEL } />
		);
		const popup = screen.getByRole( 'menu' );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe(
				parseFloat(
					getComputedStyle( popup ).getPropertyValue(
						'--available-width'
					)
				)
			);
		await view.unmount();
		await page.viewport( 1000, 800 );
	} );

	it( 'keeps submenus at the default maximum when their parent uses a larger preset', async () => {
		await render(
			<Menu.Root defaultOpen modal={ false }>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup width="md" aria-label="Actions">
					<Menu.SubmenuRoot defaultOpen>
						<Menu.SubmenuTrigger>
							<Menu.ItemLabel>More</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup aria-label="More actions">
							<Menu.Item>
								<Menu.ItemLabel>{ LONG_LABEL }</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popup>
					</Menu.SubmenuRoot>
				</Menu.Popup>
			</Menu.Root>
		);
		await expect
			.poll(
				() =>
					screen
						.getByRole( 'menu', { name: 'More' } )
						.getBoundingClientRect().width
			)
			.toBe( 320 );
	} );
} );

const FORM_POPUPS = [
	{
		name: 'Select',
		render: (
			label: string,
			anchorWidth: number,
			popupRef: RefObject< HTMLDivElement >
		) => (
			<Select.Root defaultOpen defaultValue="fruit" modal={ false }>
				<Select.Trigger style={ { width: anchorWidth } }>
					Fruit
				</Select.Trigger>
				<Select.Popup ref={ popupRef } width="sm">
					<Select.Item value="fruit">
						<Select.ItemLabel>{ label }</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		),
	},
	{
		name: 'Combobox',
		render: (
			label: string,
			anchorWidth: number,
			popupRef: RefObject< HTMLDivElement >
		) => (
			<Combobox.Root defaultOpen items={ [ label ] }>
				<Combobox.Input
					aria-label="Fruit"
					style={ { width: anchorWidth } }
				/>
				<Combobox.Popup ref={ popupRef } width="sm">
					<Combobox.List>
						<Combobox.ListBody>
							<Combobox.Item value={ label }>
								<Combobox.ItemLabel>
									{ label }
								</Combobox.ItemLabel>
							</Combobox.Item>
						</Combobox.ListBody>
					</Combobox.List>
				</Combobox.Popup>
			</Combobox.Root>
		),
	},
	{
		name: 'Autocomplete',
		render: (
			label: string,
			anchorWidth: number,
			popupRef: RefObject< HTMLDivElement >
		) => (
			<Autocomplete.Root defaultOpen items={ [ label ] }>
				<Autocomplete.Input
					aria-label="Fruit"
					style={ { width: anchorWidth } }
				/>
				<Autocomplete.Popup ref={ popupRef } width="sm">
					<Autocomplete.List>
						<Autocomplete.ListBody>
							<Autocomplete.Item value={ label }>
								<Autocomplete.ItemLabel>
									{ label }
								</Autocomplete.ItemLabel>
							</Autocomplete.Item>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Popup>
			</Autocomplete.Root>
		),
	},
];

describe.each( FORM_POPUPS )( '$name popup widths', ( example ) => {
	it( 'sizes short content below the preset maximum', async () => {
		const popupRef = createRef< HTMLDivElement >();
		await render( example.render( 'Apple', 120, popupRef ) );
		await expect
			.poll( () => popupRef.current!.getBoundingClientRect().width )
			.toBeLessThan( 320 );
	} );

	it( 'caps long content at the preset maximum', async () => {
		const popupRef = createRef< HTMLDivElement >();
		await render( example.render( LONG_LABEL, 120, popupRef ) );
		await expect
			.poll( () => popupRef.current!.getBoundingClientRect().width )
			.toBe( 320 );
	} );

	it( 'stays at least as wide as an anchor wider than the preset maximum', async () => {
		const popupRef = createRef< HTMLDivElement >();
		await render( example.render( 'Apple', 400, popupRef ) );
		const popup = popupRef.current!;
		const anchorWidth = parseFloat(
			getComputedStyle( popup ).getPropertyValue( '--anchor-width' )
		);
		expect( anchorWidth ).toBeGreaterThan( 320 );
		await expect
			.poll( () => popup.getBoundingClientRect().width )
			.toBe( anchorWidth );
	} );
} );
