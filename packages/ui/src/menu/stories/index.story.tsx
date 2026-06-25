import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { archive } from '@wordpress/icons';
import { Icon } from '../../icon';
import * as Menu from '../';

const meta: Meta< typeof Menu.Root > = {
	title: 'Design System/Components/Menu',
	component: Menu.Root,
	subcomponents: {
		'Menu.Trigger': Menu.Trigger,
		'Menu.Portal': Menu.Portal,
		'Menu.Positioner': Menu.Positioner,
		'Menu.Popup': Menu.Popup,
		'Menu.Item': Menu.Item,
		'Menu.CheckboxItem': Menu.CheckboxItem,
		'Menu.RadioGroup': Menu.RadioGroup,
		'Menu.RadioItem': Menu.RadioItem,
		'Menu.Group': Menu.Group,
		'Menu.GroupLabel': Menu.GroupLabel,
		'Menu.Separator': Menu.Separator,
		'Menu.SubmenuRoot': Menu.SubmenuRoot,
		'Menu.SubmenuTrigger': Menu.SubmenuTrigger,
	},
	argTypes: {
		children: { control: false },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Menu.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>Add to library</Menu.Item>
					<Menu.Item
						prefix={
							<Icon icon={ archive } size={ 24 } aria-hidden />
						}
					>
						Archive
					</Menu.Item>
					<Menu.Item suffix="⌘S">Save</Menu.Item>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Playback</Menu.GroupLabel>
						<Menu.Item>Play next</Menu.Item>
						<Menu.Item>Play last</Menu.Item>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Item disabled>Unavailable action</Menu.Item>
				</Menu.Popup>
			</>
		),
	},
};

export const Submenu: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>Rename</Menu.Item>
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>Archive</Menu.Item>
							<Menu.Item>Favorites</Menu.Item>
						</Menu.Popup>
					</Menu.SubmenuRoot>
					<Menu.Item>Delete</Menu.Item>
				</Menu.Popup>
			</>
		),
	},
};

export const CheckboxItems: Story = {
	render: function Render() {
		const [ bookmarks, setBookmarks ] = useState( true );
		const [ downloads, setDownloads ] = useState( false );

		return (
			<Menu.Root>
				<Menu.Trigger>Columns</Menu.Trigger>
				<Menu.Popup>
					<Menu.CheckboxItem
						checked={ bookmarks }
						onCheckedChange={ setBookmarks }
					>
						Bookmarks
					</Menu.CheckboxItem>
					<Menu.CheckboxItem
						checked={ downloads }
						onCheckedChange={ setDownloads }
					>
						Downloads
					</Menu.CheckboxItem>
				</Menu.Popup>
			</Menu.Root>
		);
	},
};

export const RadioItems: Story = {
	render: function Render() {
		const [ value, setValue ] = useState( 'name' );

		return (
			<Menu.Root>
				<Menu.Trigger>Sort</Menu.Trigger>
				<Menu.Popup>
					<Menu.RadioGroup value={ value } onValueChange={ setValue }>
						<Menu.RadioItem value="name">Name</Menu.RadioItem>
						<Menu.RadioItem value="date">Date</Menu.RadioItem>
						<Menu.RadioItem value="manual">Manual</Menu.RadioItem>
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		);
	},
};

export const Positioning: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup
					positioner={
						<Menu.Positioner side="right" align="start" />
					}
				>
					<Menu.Item>Duplicate</Menu.Item>
					<Menu.Item>Move</Menu.Item>
				</Menu.Popup>
			</>
		),
	},
};
