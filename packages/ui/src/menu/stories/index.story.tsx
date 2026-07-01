import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { archive } from '@wordpress/icons';
import { ariaKeyShortcut, displayShortcut } from '@wordpress/keycodes';
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
		'Menu.ItemLabel': Menu.ItemLabel,
		'Menu.ItemDescription': Menu.ItemDescription,
		'Menu.LinkItem': Menu.LinkItem,
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
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};

export default meta;

type Story = StoryObj< typeof Menu.Root >;

const SAVE_SHORTCUT = {
	displayShortcut: displayShortcut.primary( 's' ),
	ariaKeyShortcut: ariaKeyShortcut.primary( 's' ),
};

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
					<Menu.LinkItem href="https://wordpress.org">
						WordPress.org
					</Menu.LinkItem>
					<Menu.Item disabled>Unavailable action</Menu.Item>
				</Menu.Popup>
			</>
		),
	},
};

export const LinkItem: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem
						href="https://wordpress.org"
						target="_blank"
						rel="noreferrer noopener"
					>
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
						<Menu.ItemDescription>
							Open the WordPress project website.
						</Menu.ItemDescription>
					</Menu.LinkItem>
					<Menu.LinkItem href="#menu-link-item-example">
						<Menu.ItemLabel>In-page destination</Menu.ItemLabel>
						<Menu.ItemDescription>
							Navigate with a regular anchor target.
						</Menu.ItemDescription>
					</Menu.LinkItem>
				</Menu.Popup>
			</>
		),
	},
};

/**
 * Use `ariaKeyShortcut` for the `aria-keyshortcuts` value, and keep the suffix
 * as the visual shortcut label.
 */
export const KeyboardShortcuts: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item
						aria-keyshortcuts={ SAVE_SHORTCUT.ariaKeyShortcut }
						suffix={ SAVE_SHORTCUT.displayShortcut }
					>
						Save
					</Menu.Item>
					<Menu.Item
						aria-keyshortcuts={ ariaKeyShortcut.primary( 'k' ) }
						suffix={ displayShortcut.primary( 'k' ) }
					>
						Open command palette
					</Menu.Item>
				</Menu.Popup>
			</>
		),
	},
};

export const RichItems: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>Label</Menu.ItemLabel>
						<Menu.ItemDescription>Help text</Menu.ItemDescription>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>
							Label with a long description
						</Menu.ItemLabel>
						<Menu.ItemDescription>
							The menu item description wraps within the popup
							instead of creating extra grid columns.
						</Menu.ItemDescription>
					</Menu.Item>
					<Menu.Item
						prefix={
							<Icon icon={ archive } size={ 24 } aria-hidden />
						}
						suffix="⌘S"
					>
						<Menu.ItemLabel>With prefix and suffix</Menu.ItemLabel>
						<Menu.ItemDescription>
							Description text keeps the same highlighted area.
						</Menu.ItemDescription>
					</Menu.Item>
					<Menu.Item disabled suffix="⌘D">
						<Menu.ItemLabel>Disabled item</Menu.ItemLabel>
						<Menu.ItemDescription>
							Disabled foreground treatment applies to all item
							content.
						</Menu.ItemDescription>
					</Menu.Item>
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
						<Menu.SubmenuTrigger suffix="⌘M">
							<Menu.ItemLabel>
								Move to another collection
							</Menu.ItemLabel>
						</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>Archive</Menu.Item>
							<Menu.Item>Favorites</Menu.Item>
							<Menu.SubmenuRoot>
								<Menu.SubmenuTrigger>
									<Menu.ItemLabel>
										More destinations
									</Menu.ItemLabel>
								</Menu.SubmenuTrigger>
								<Menu.Popup>
									<Menu.Item>Reviewed</Menu.Item>
									<Menu.Item>Shared</Menu.Item>
								</Menu.Popup>
							</Menu.SubmenuRoot>
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
					<Menu.Group>
						<Menu.GroupLabel>Visible columns</Menu.GroupLabel>
						<Menu.CheckboxItem
							checked={ bookmarks }
							onCheckedChange={ setBookmarks }
						>
							<Menu.ItemLabel>Bookmarks</Menu.ItemLabel>
							<Menu.ItemDescription>
								Show saved pages in the table.
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							checked={ downloads }
							onCheckedChange={ setDownloads }
							suffix="⌘D"
						>
							<Menu.ItemLabel>Downloads</Menu.ItemLabel>
							<Menu.ItemDescription>
								Show downloaded files in the table.
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
					</Menu.Group>
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
						<Menu.Group>
							<Menu.GroupLabel>Sort by</Menu.GroupLabel>
							<Menu.RadioItem value="name">
								<Menu.ItemLabel>Name</Menu.ItemLabel>
								<Menu.ItemDescription>
									Sort alphabetically.
								</Menu.ItemDescription>
							</Menu.RadioItem>
							<Menu.RadioItem value="date">
								<Menu.ItemLabel>Date</Menu.ItemLabel>
								<Menu.ItemDescription>
									Sort by most recent activity.
								</Menu.ItemDescription>
							</Menu.RadioItem>
							<Menu.RadioItem value="manual">
								<Menu.ItemLabel>Manual</Menu.ItemLabel>
								<Menu.ItemDescription>
									Keep the current custom order.
								</Menu.ItemDescription>
							</Menu.RadioItem>
						</Menu.Group>
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
