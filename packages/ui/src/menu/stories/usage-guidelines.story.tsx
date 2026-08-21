import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import * as Autocomplete from '../../form/primitives/autocomplete';
import { SelectControl } from '../../form/select-control';
import * as Menu from '../';

const meta: Meta = {
	title: 'Design System/Components/Menu/Usage Guidelines',
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' ],
};
export default meta;

type Story = StoryObj;

const viewItems = [
	{ value: 'list', label: 'List' },
	{ value: 'grid', label: 'Grid' },
];

const commandItems = [
	{ id: 'duplicate', value: 'Duplicate' },
	{ id: 'download', value: 'Download' },
	{ id: 'view-details', value: 'View details' },
];

/**
 * Use SelectControl when the trigger represents a value and opens choices for
 * replacing it.
 */
export const SelectForValues: Story = {
	render: () => (
		<SelectControl
			label="View"
			items={ viewItems }
			defaultValue={ viewItems[ 0 ] }
		/>
	),
};

/**
 * Use Menu when the trigger opens commands or destinations.
 */
export const MenuForCommands: Story = {
	render: () => (
		<Menu.Root>
			<Menu.Trigger>Actions</Menu.Trigger>
			<Menu.Popup>
				<Menu.Item>
					<Menu.ItemLabel>Duplicate</Menu.ItemLabel>
				</Menu.Item>
				<Menu.Item>
					<Menu.ItemLabel>Download</Menu.ItemLabel>
				</Menu.Item>
				<Menu.LinkItem href="#menu-usage-guidelines-destination">
					<Menu.ItemLabel>View details</Menu.ItemLabel>
				</Menu.LinkItem>
			</Menu.Popup>
		</Menu.Root>
	),
};

/**
 * Use Autocomplete when users need to type to filter a menu-like list of
 * commands or suggestions. The input also accepts free-form text.
 */
export const AutocompleteForSearchableCommands: Story = {
	render: () => (
		<Autocomplete.Root items={ commandItems }>
			<Autocomplete.Input
				aria-label="Search commands"
				placeholder="Search commands"
			/>
			<Autocomplete.Popup>
				<Autocomplete.Empty>No commands found.</Autocomplete.Empty>
				<Autocomplete.List>
					<Autocomplete.ListBody>
						<Autocomplete.Collection>
							{ (
								command: ( typeof commandItems )[ number ]
							) => (
								<Autocomplete.Item
									key={ command.id }
									value={ command }
								>
									{ command.value }
								</Autocomplete.Item>
							) }
						</Autocomplete.Collection>
					</Autocomplete.ListBody>
				</Autocomplete.List>
			</Autocomplete.Popup>
		</Autocomplete.Root>
	),
};

/**
 * Checkbox and radio items represent settings within a broader command menu.
 * Use SelectControl instead when choosing one value is the control's purpose.
 */
export const CheckedOptionsWithinACommandMenu: Story = {
	render: function Render() {
		const [ showAuthor, setShowAuthor ] = useState( true );
		const [ showDate, setShowDate ] = useState( false );
		const [ density, setDensity ] = useState( 'comfortable' );

		return (
			<Menu.Root>
				<Menu.Trigger>View options</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Reset view</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Visible columns</Menu.GroupLabel>
						<Menu.CheckboxItem
							checked={ showAuthor }
							onCheckedChange={ setShowAuthor }
						>
							<Menu.ItemLabel>Author</Menu.ItemLabel>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							checked={ showDate }
							onCheckedChange={ setShowDate }
						>
							<Menu.ItemLabel>Date</Menu.ItemLabel>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.RadioGroup
						value={ density }
						onValueChange={ setDensity }
					>
						<Menu.GroupLabel>Density</Menu.GroupLabel>
						<Menu.RadioItem value="compact">
							<Menu.ItemLabel>Compact</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem value="comfortable">
							<Menu.ItemLabel>Comfortable</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		);
	},
};
