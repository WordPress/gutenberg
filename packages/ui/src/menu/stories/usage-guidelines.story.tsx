import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { SelectControl } from '../../form/select-control';
import { Stack } from '../../stack';
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

/**
 * Use SelectControl when the trigger represents a value and opens choices for
 * replacing it. Use Menu when the trigger opens commands or destinations.
 */
export const SelectForValuesMenuForCommands: Story = {
	render: () => (
		<Stack direction="row" gap="lg" wrap="wrap" align="start">
			<SelectControl
				label="View"
				items={ viewItems }
				defaultValue={ viewItems[ 0 ] }
			/>
			<Menu.Root>
				<Menu.Trigger>Actions</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>Duplicate</Menu.Item>
					<Menu.Item>Download</Menu.Item>
					<Menu.LinkItem href="#menu-usage-guidelines-destination">
						View details
					</Menu.LinkItem>
				</Menu.Popup>
			</Menu.Root>
		</Stack>
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
					<Menu.Item>Reset view</Menu.Item>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Visible columns</Menu.GroupLabel>
						<Menu.CheckboxItem
							checked={ showAuthor }
							onCheckedChange={ setShowAuthor }
						>
							Author
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							checked={ showDate }
							onCheckedChange={ setShowDate }
						>
							Date
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.RadioGroup
						value={ density }
						onValueChange={ setDensity }
					>
						<Menu.Group>
							<Menu.GroupLabel>Density</Menu.GroupLabel>
							<Menu.RadioItem value="compact">
								Compact
							</Menu.RadioItem>
							<Menu.RadioItem value="comfortable">
								Comfortable
							</Menu.RadioItem>
						</Menu.Group>
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		);
	},
};
