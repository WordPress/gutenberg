import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import * as Autocomplete from '../../autocomplete';
import * as Combobox from '../../combobox';
import * as Select from '../../select';

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

const detailStyle: CSSProperties = {
	color: 'var(--wpds-color-foreground-content-neutral-weak)',
	whiteSpace: 'nowrap',
};

const avatarStyle: CSSProperties = {
	background: 'var(--wpds-color-background-interactive-brand-strong)',
	borderRadius: '50%',
	flexShrink: 0,
	height: 16,
	width: 16,
};

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
							<Combobox.Item value="Apple">Apple</Combobox.Item>
							<Combobox.Item value="Banana">Banana</Combobox.Item>
							<Combobox.Item value="Blackberry">
								<span>Blackberry</span>
								<span style={ detailStyle }>99 in stock</span>
							</Combobox.Item>
							<Combobox.Item value="Blueberry">
								<span
									style={ avatarStyle }
									aria-hidden="true"
								/>
								<span>Blueberry with a leading avatar</span>
							</Combobox.Item>
							<Combobox.Item value="Pineapple">
								<span>
									Pineapple with a long label that wraps onto
									a second line in a narrow popup
								</span>
							</Combobox.Item>
							<Combobox.Item
								value="Create fruit"
								variant="creatable"
							>
								Create fruit
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
								Apple
							</Autocomplete.Item>
							<Autocomplete.Item value="Apricot">
								<span>Apricot</span>
								<span style={ detailStyle }>12 in stock</span>
							</Autocomplete.Item>
							<Autocomplete.Item value="Avocado">
								<span
									style={ avatarStyle }
									aria-hidden="true"
								/>
								<span>Avocado with a leading avatar</span>
							</Autocomplete.Item>
							<Autocomplete.Item value="Blackberry">
								<strong>Black</strong>
								<span>berry</span>
							</Autocomplete.Item>
							<Autocomplete.Item value="Pineapple">
								Pineapple with a long label that wraps onto a
								second line in a narrow popup
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
							Tropical fruit with a sweet taste.
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
