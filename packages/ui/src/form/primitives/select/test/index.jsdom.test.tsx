import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useId } from '@wordpress/element';
import type { ComponentType, ReactNode } from 'react';
import * as Select from '../index';

describe( 'Select', () => {
	it( 'auto-resolves trigger label from items when value is an object', () => {
		const users = [
			{ value: '1', label: 'User 1' },
			{ value: '2', label: 'User 2' },
		];

		render(
			<Select.Root defaultValue={ users[ 0 ] } items={ users }>
				<Select.Trigger />
				<Select.Popup>
					{ users.map( ( option ) => (
						<Select.Item key={ option.value } value={ option }>
							<Select.ItemLabel>
								{ option.label }
							</Select.ItemLabel>
						</Select.Item>
					) ) }
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'User 1' );
	} );

	it( 'renders a default placeholder when no value is selected', () => {
		render(
			<Select.Root>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="Item 1">
						<Select.ItemLabel>Item 1</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'Select' );
	} );

	it( 'supports custom placeholder text', () => {
		render(
			<Select.Root>
				<Select.Trigger placeholder="Choose an item" />
				<Select.Popup>
					<Select.Item value="Item 1">
						<Select.ItemLabel>Item 1</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent(
			'Choose an item'
		);
	} );

	it( 'supports custom rendering for item labels and descriptions', async () => {
		const user = userEvent.setup();
		const items = [ { value: 'apple', label: 'Apple' } ];

		render(
			<Select.Root items={ items }>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value={ items[ 0 ] }>
						<Select.ItemLabel render={ <h2 /> }>
							Apple
						</Select.ItemLabel>
						<Select.ItemDescription render={ <h3 /> }>
							99 in stock
						</Select.ItemDescription>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const item = await screen.findByRole( 'option', { name: 'Apple' } );

		expect( screen.getByText( 'Apple' ).tagName ).toBe( 'H2' );
		expect( screen.getByText( '99 in stock' ).tagName ).toBe( 'H3' );

		await user.click( item );

		expect( screen.getByRole( 'combobox' ) ).toHaveTextContent( 'Apple' );
		expect( screen.getByRole( 'combobox' ) ).not.toHaveTextContent(
			'99 in stock'
		);
	} );

	it( 'renders the default item label as a div in a div grouping box', async () => {
		const user = userEvent.setup();

		render(
			<Select.Root>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="apple">
						<Select.ItemLabel>Apple</Select.ItemLabel>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const item = await screen.findByRole( 'option', { name: 'Apple' } );
		expect( item ).toBeVisible();

		const label = screen.getByText( 'Apple' );
		expect( label.tagName ).toBe( 'DIV' );
		expect( label.parentElement?.tagName ).toBe( 'DIV' );
	} );

	it( 'keeps ItemDescription out of the trigger', async () => {
		const user = userEvent.setup();
		const items = [ { value: 'apple', label: 'Apple' } ];

		render(
			<Select.Root items={ items } defaultValue={ items[ 0 ] }>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value={ items[ 0 ] }>
						<Select.ItemLabel>Apple</Select.ItemLabel>
						<Select.ItemDescription>
							99 in stock
						</Select.ItemDescription>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Apple' );
		expect( trigger ).not.toHaveTextContent( '99 in stock' );

		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'option', { name: 'Apple' } )
		);

		expect( trigger ).toHaveTextContent( 'Apple' );
		expect( trigger ).not.toHaveTextContent( '99 in stock' );
	} );

	it( 'uses item descriptions as accessible descriptions', async () => {
		const user = userEvent.setup();

		render(
			<Select.Root>
				<Select.Trigger />
				<Select.Popup>
					<Select.Item value="apple">
						<Select.ItemLabel>Apple</Select.ItemLabel>
						<Select.ItemDescription>
							Create a <strong>separate</strong> copy.
						</Select.ItemDescription>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		);

		await user.click( screen.getByRole( 'combobox' ) );

		const item = await screen.findByRole( 'option', { name: 'Apple' } );

		expect( item ).toHaveAccessibleDescription( 'Create a separate copy.' );
		expect( screen.getByText( 'separate' ).tagName ).toBe( 'STRONG' );
	} );

	it( 'combines multiple item descriptions in DOM order', async () => {
		const user = userEvent.setup();

		function SelectWithMultipleDescriptions() {
			const externalDescriptionId = useId();
			const firstDescriptionId = useId();

			return (
				<Select.Root>
					<Select.Trigger />
					<span id={ externalDescriptionId }>Available offline.</span>
					<Select.Popup>
						<Select.Item
							value="save"
							aria-describedby={ externalDescriptionId }
						>
							<Select.ItemLabel>Save</Select.ItemLabel>
							<Select.ItemDescription id={ firstDescriptionId }>
								Save to this device.
							</Select.ItemDescription>
							<Select.ItemDescription>
								Keeps the current version.
							</Select.ItemDescription>
						</Select.Item>
					</Select.Popup>
				</Select.Root>
			);
		}

		render( <SelectWithMultipleDescriptions /> );

		await user.click( screen.getByRole( 'combobox' ) );

		const item = await screen.findByRole( 'option', { name: 'Save' } );
		const externalDescription = screen.getByText( 'Available offline.' );
		const firstDescription = screen.getByText( 'Save to this device.' );
		const secondDescription = screen.getByText(
			'Keeps the current version.'
		);

		expect( item ).toHaveAccessibleDescription(
			'Available offline. Save to this device. Keeps the current version.'
		);
		expect( firstDescription.id ).not.toBe( '' );
		expect( secondDescription.id ).not.toBe( '' );
		expect( secondDescription.id ).not.toBe( firstDescription.id );
		expect( item ).toHaveAttribute(
			'aria-describedby',
			`${ externalDescription.id } ${ firstDescription.id } ${ secondDescription.id }`
		);
	} );

	it( 'requires an ItemLabel as a direct child of every item', () => {
		const InvalidItem = Select.Item as ComponentType< {
			value: string;
			children?: ReactNode;
		} >;

		expect( () =>
			render(
				<Select.Root defaultOpen>
					<Select.Trigger />
					<Select.Popup>
						<InvalidItem value="duplicate">Duplicate</InvalidItem>
					</Select.Popup>
				</Select.Root>
			)
		).toThrow( 'Select.ItemLabel must be the first direct child' );
		expect( console ).toHaveErrored();
	} );
} );
