import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import * as Autocomplete from '../../autocomplete';
import * as Combobox from '../../combobox';
import * as Select from '../../select';
import { Stack } from '../../../../stack';

const matrixStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(2, minmax(0, 320px))',
	gap: 24,
	padding: 24,
};

const headingStyle: CSSProperties = {
	fontSize: 16,
	marginBlock: '0 12px',
};

const avatarStyle: CSSProperties = {
	background: 'var(--wpds-color-background-interactive-brand-strong)',
	borderRadius: '50%',
	flexShrink: 0,
	height: 16,
	width: 16,
};

const avatarLabelLayout = <Stack direction="row" gap="sm" align="center" />;

const comboboxItems = [
	'Apple',
	'Banana',
	'Blackberry',
	'Blueberry',
	'Pineapple',
	'Create fruit',
];

const autocompleteItems = [
	'Apple',
	'Apricot',
	'Avocado',
	'Blackberry',
	'Pineapple',
];

function RichItemLayouts() {
	return (
		<div style={ matrixStyle }>
			<section aria-label="Combobox items">
				<h2 style={ headingStyle }>Combobox items</h2>
				<Combobox.Root
					items={ comboboxItems }
					defaultValue="Apple"
					inline
					open
				>
					<Combobox.Input aria-label="Filter Combobox items" />
					<Combobox.List>
						<Combobox.ListBody>
							<Combobox.Item value="Apple">
								<Combobox.ItemLabel>Apple</Combobox.ItemLabel>
							</Combobox.Item>
							<Combobox.Item value="Banana">
								<Combobox.ItemLabel>Banana</Combobox.ItemLabel>
							</Combobox.Item>
							<Combobox.Item value="Blackberry">
								<Combobox.ItemLabel>
									Blackberry
								</Combobox.ItemLabel>
								<Combobox.ItemDescription>
									99 in stock
								</Combobox.ItemDescription>
							</Combobox.Item>
							<Combobox.Item value="Blueberry">
								<Combobox.ItemLabel
									render={ avatarLabelLayout }
								>
									<span
										style={ avatarStyle }
										aria-hidden="true"
									/>
									Blueberry with a leading avatar
								</Combobox.ItemLabel>
							</Combobox.Item>
							<Combobox.Item value="Pineapple">
								<Combobox.ItemLabel>
									Pineapple with a long label that wraps onto
									a second line in a narrow popup
								</Combobox.ItemLabel>
								<Combobox.ItemDescription>
									Sweet, tangy fruit with a firm texture that
									works well in salads, smoothies, and
									desserts.
								</Combobox.ItemDescription>
							</Combobox.Item>
							<Combobox.Item
								value="Create fruit"
								variant="creatable"
							>
								<Combobox.ItemLabel>
									Create fruit
								</Combobox.ItemLabel>
							</Combobox.Item>
						</Combobox.ListBody>
					</Combobox.List>
				</Combobox.Root>
			</section>
			<section aria-label="Autocomplete items">
				<h2 style={ headingStyle }>Autocomplete items</h2>
				<Autocomplete.Root items={ autocompleteItems } inline open>
					<Autocomplete.Input aria-label="Filter Autocomplete items" />
					<Autocomplete.List>
						<Autocomplete.ListBody>
							<Autocomplete.Item value="Apple">
								<Autocomplete.ItemLabel>
									Apple
								</Autocomplete.ItemLabel>
							</Autocomplete.Item>
							<Autocomplete.Item value="Apricot">
								<Autocomplete.ItemLabel>
									Apricot
								</Autocomplete.ItemLabel>
								<Autocomplete.ItemDescription>
									12 in stock
								</Autocomplete.ItemDescription>
							</Autocomplete.Item>
							<Autocomplete.Item value="Avocado">
								<Autocomplete.ItemLabel
									render={ avatarLabelLayout }
								>
									<span
										style={ avatarStyle }
										aria-hidden="true"
									/>
									Avocado with a leading avatar
								</Autocomplete.ItemLabel>
							</Autocomplete.Item>
							<Autocomplete.Item value="Blackberry">
								<Autocomplete.ItemLabel>
									<strong>Black</strong>
									<span>berry</span>
								</Autocomplete.ItemLabel>
							</Autocomplete.Item>
							<Autocomplete.Item value="Pineapple">
								<Autocomplete.ItemLabel>
									Pineapple with a long label that wraps onto
									a second line in a narrow popup
								</Autocomplete.ItemLabel>
								<Autocomplete.ItemDescription>
									Sweet, tangy fruit with a firm texture that
									works well in salads, smoothies, and
									desserts.
								</Autocomplete.ItemDescription>
							</Autocomplete.Item>
						</Autocomplete.ListBody>
					</Autocomplete.List>
				</Autocomplete.Root>
			</section>
		</div>
	);
}

function SelectItemLayouts() {
	return (
		<div style={ { minHeight: 340, padding: 24, width: 320 } }>
			<h2 style={ headingStyle }>Select items</h2>
			<Select.Root
				items={ [
					{ label: 'Apple', value: 'apple' },
					{ label: 'Banana', value: 'banana' },
					{ label: 'Pineapple', value: 'pineapple' },
				] }
				defaultValue="apple"
				open
				modal={ false }
			>
				<Select.Trigger aria-label="Select fruit" />
				<Select.Popup width="md">
					<Select.Item value="apple">
						<Select.ItemLabel>Apple</Select.ItemLabel>
						<Select.ItemDescription>
							Sweet and crisp.
						</Select.ItemDescription>
					</Select.Item>
					<Select.Item value="banana">
						<Select.ItemLabel>Banana</Select.ItemLabel>
					</Select.Item>
					<Select.Item value="pineapple">
						<Select.ItemLabel>
							Pineapple with a long label that wraps onto a second
							line
						</Select.ItemLabel>
						<Select.ItemDescription>
							Sweet, tangy fruit with a firm texture that works
							well in salads, smoothies, and desserts.
						</Select.ItemDescription>
					</Select.Item>
				</Select.Popup>
			</Select.Root>
		</div>
	);
}

const meta: Meta = {
	title: 'Design System/Components/Popup item layouts',
	id: 'design-system-components-popup-item-layouts',
};
export default meta;

type Story = StoryObj;

export const RichItems: Story = {
	render: () => <RichItemLayouts />,
};

export const SelectItems: Story = {
	render: () => <SelectItemLayouts />,
};
