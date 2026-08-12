import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import {
	archive,
	create,
	alignLeft,
	alignCenter,
	alignRight,
} from '@wordpress/icons';
import {
	ariaKeyShortcut,
	displayShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
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

const SHORTCUTS = {
	comfortableDensity: {
		displayShortcut: displayShortcut.primary( '2' ),
		ariaKeyShortcut: ariaKeyShortcut.primary( '2' ),
		label: shortcutAriaLabel.primary( '2' ),
	},
	developerResources: {
		displayShortcut: displayShortcut.primary( 'd' ),
		ariaKeyShortcut: ariaKeyShortcut.primary( 'd' ),
		label: shortcutAriaLabel.primary( 'd' ),
	},
	downloads: {
		displayShortcut: displayShortcut.primary( 'd' ),
		ariaKeyShortcut: ariaKeyShortcut.primary( 'd' ),
		label: shortcutAriaLabel.primary( 'd' ),
	},
	move: {
		displayShortcut: displayShortcut.primary( 'm' ),
		ariaKeyShortcut: ariaKeyShortcut.primary( 'm' ),
		label: shortcutAriaLabel.primary( 'm' ),
	},
	save: {
		displayShortcut: displayShortcut.primary( 's' ),
		ariaKeyShortcut: ariaKeyShortcut.primary( 's' ),
		label: shortcutAriaLabel.primary( 's' ),
	},
	shared: {
		displayShortcut: displayShortcut.primaryShift( 's' ),
		ariaKeyShortcut: ariaKeyShortcut.primaryShift( 's' ),
		label: shortcutAriaLabel.primaryShift( 's' ),
	},
};

export const Default: Story = {
	render: function Render() {
		const [ bookmarks, setBookmarks ] = useState( true );
		const [ downloads, setDownloads ] = useState( false );
		const [ view, setView ] = useState( 'list' );

		return (
			<Menu.Root>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item
						prefix={
							<Icon icon={ archive } size={ 24 } aria-hidden />
						}
					>
						Rename
					</Menu.Item>
					<Menu.Item
						prefix={
							<Icon icon={ archive } size={ 24 } aria-hidden />
						}
					>
						Archive
					</Menu.Item>
					<Menu.Item
						prefix={
							<Icon icon={ archive } size={ 24 } aria-hidden />
						}
						shortcut={ SHORTCUTS.save }
						suffix="Draft"
					>
						Save
					</Menu.Item>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Links</Menu.GroupLabel>
						<Menu.LinkItem href="#menu-default-example">
							View details
						</Menu.LinkItem>
						<Menu.LinkItem
							href="https://wordpress.org"
							openInNewTab
						>
							WordPress.org
						</Menu.LinkItem>
					</Menu.Group>
					<Menu.Separator />
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
							shortcut={ SHORTCUTS.downloads }
						>
							<Menu.ItemLabel>Downloads</Menu.ItemLabel>
							<Menu.ItemDescription>
								Show downloaded files in the table.
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.RadioGroup value={ view } onValueChange={ setView }>
						<Menu.Group>
							<Menu.GroupLabel>View</Menu.GroupLabel>
							<Menu.RadioItem
								value="list"
								prefix={
									<Icon
										icon={ archive }
										size={ 24 }
										aria-hidden
									/>
								}
							>
								<Menu.ItemLabel>List</Menu.ItemLabel>
								<Menu.ItemDescription>
									Show compact rows.
								</Menu.ItemDescription>
							</Menu.RadioItem>
							<Menu.RadioItem
								value="grid"
								prefix={
									<Icon
										icon={ archive }
										size={ 24 }
										aria-hidden
									/>
								}
							>
								<Menu.ItemLabel>Grid</Menu.ItemLabel>
								<Menu.ItemDescription>
									Show larger preview tiles.
								</Menu.ItemDescription>
							</Menu.RadioItem>
						</Menu.Group>
					</Menu.RadioGroup>
					<Menu.Separator />
					<Menu.SubmenuRoot>
						<Menu.SubmenuTrigger
							shortcut={ SHORTCUTS.move }
							suffix="3"
						>
							<Menu.ItemLabel>Move to</Menu.ItemLabel>
							<Menu.ItemDescription>
								Choose another collection.
							</Menu.ItemDescription>
						</Menu.SubmenuTrigger>
						<Menu.Popup>
							<Menu.Item>Favorites</Menu.Item>
							<Menu.Item
								prefix={
									<Icon
										icon={ archive }
										size={ 24 }
										aria-hidden
									/>
								}
							>
								Archive
							</Menu.Item>
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
					<Menu.Item disabled>Unavailable action</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		);
	},
};

export const LinkItem: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.LinkItem href="https://wordpress.org" openInNewTab>
						<Menu.ItemLabel>WordPress.org</Menu.ItemLabel>
						<Menu.ItemDescription>
							Open the WordPress project website.
						</Menu.ItemDescription>
					</Menu.LinkItem>
					<Menu.LinkItem
						href="https://developer.wordpress.org"
						openInNewTab
						shortcut={ SHORTCUTS.developerResources }
						suffix="Docs"
					>
						<Menu.ItemLabel>
							WordPress developer resources
						</Menu.ItemLabel>
						<Menu.ItemDescription>
							Open docs with a visible suffix and external
							indicator.
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
						shortcut={ SHORTCUTS.save }
						suffix="Modified"
					>
						<Menu.ItemLabel>With prefix and suffix</Menu.ItemLabel>
						<Menu.ItemDescription>
							Description text keeps the same highlighted area.
						</Menu.ItemDescription>
					</Menu.Item>
					<Menu.Item disabled shortcut={ SHORTCUTS.downloads }>
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

export const GroupedItems: Story = {
	args: {
		children: (
			<>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Group>
						<Menu.GroupLabel>File</Menu.GroupLabel>
						<Menu.Item
							prefix={
								<Icon icon={ create } size={ 24 } aria-hidden />
							}
						>
							<Menu.ItemLabel>New draft</Menu.ItemLabel>
							<Menu.ItemDescription>
								Create a new draft document.
							</Menu.ItemDescription>
						</Menu.Item>
						<Menu.Item
							prefix={
								<Icon
									icon={ archive }
									size={ 24 }
									aria-hidden
								/>
							}
							shortcut={ SHORTCUTS.save }
						>
							Save
						</Menu.Item>
						<Menu.Item suffix="Edited">
							<Menu.ItemLabel>Save as copy</Menu.ItemLabel>
							<Menu.ItemDescription>
								Create a duplicate from the current version.
							</Menu.ItemDescription>
						</Menu.Item>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Organize</Menu.GroupLabel>
						<Menu.Item
							prefix={
								<Icon
									icon={ archive }
									size={ 24 }
									aria-hidden
								/>
							}
							shortcut={ SHORTCUTS.move }
							suffix="3"
						>
							<Menu.ItemLabel>Move to collection</Menu.ItemLabel>
							<Menu.ItemDescription>
								Choose from recent destinations.
							</Menu.ItemDescription>
						</Menu.Item>
						<Menu.Item
							prefix={
								<Icon
									icon={ archive }
									size={ 24 }
									aria-hidden
								/>
							}
							suffix="12"
						>
							Archive
						</Menu.Item>
					</Menu.Group>
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
						<Menu.SubmenuTrigger shortcut={ SHORTCUTS.move }>
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
		const [ archived, setArchived ] = useState( true );
		const [ shared, setShared ] = useState( false );

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
							shortcut={ SHORTCUTS.downloads }
						>
							<Menu.ItemLabel>Downloads</Menu.ItemLabel>
							<Menu.ItemDescription>
								Show downloaded files in the table.
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Saved areas</Menu.GroupLabel>
						<Menu.CheckboxItem
							checked={ archived }
							onCheckedChange={ setArchived }
							prefix={
								<Icon
									icon={ archive }
									size={ 24 }
									aria-hidden
								/>
							}
						>
							<Menu.ItemLabel>Archived</Menu.ItemLabel>
							<Menu.ItemDescription>
								Include archived records.
							</Menu.ItemDescription>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							checked={ shared }
							onCheckedChange={ setShared }
							prefix={
								<Icon
									icon={ archive }
									size={ 24 }
									aria-hidden
								/>
							}
							shortcut={ SHORTCUTS.shared }
						>
							<Menu.ItemLabel>Shared</Menu.ItemLabel>
							<Menu.ItemDescription>
								Include shared records.
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
		const [ alignment, setAlignment ] = useState( 'left' );
		const [ density, setDensity ] = useState( 'comfortable' );

		return (
			<Menu.Root>
				<Menu.Trigger>View options</Menu.Trigger>
				<Menu.Popup>
					<Menu.Group>
						<Menu.GroupLabel>Alignment</Menu.GroupLabel>

						<Menu.RadioGroup
							value={ alignment }
							onValueChange={ setAlignment }
						>
							<Menu.RadioItem
								value="left"
								prefix={
									<Icon icon={ alignLeft } aria-hidden />
								}
							>
								<Menu.ItemLabel>Left</Menu.ItemLabel>
							</Menu.RadioItem>
							<Menu.RadioItem
								value="center"
								prefix={
									<Icon icon={ alignCenter } aria-hidden />
								}
							>
								<Menu.ItemLabel>Center</Menu.ItemLabel>
							</Menu.RadioItem>
							<Menu.RadioItem
								value="right"
								prefix={
									<Icon icon={ alignRight } aria-hidden />
								}
							>
								<Menu.ItemLabel>Right</Menu.ItemLabel>
							</Menu.RadioItem>
						</Menu.RadioGroup>
						<Menu.Item>Reset alignment</Menu.Item>
					</Menu.Group>
					<Menu.Separator />
					<Menu.RadioGroup
						value={ density }
						onValueChange={ setDensity }
					>
						<Menu.Group>
							<Menu.GroupLabel>Density</Menu.GroupLabel>
							<Menu.RadioItem value="compact">
								<Menu.ItemLabel>Compact</Menu.ItemLabel>
								<Menu.ItemDescription>
									Show shorter rows.
								</Menu.ItemDescription>
							</Menu.RadioItem>
							<Menu.RadioItem
								value="comfortable"
								shortcut={ SHORTCUTS.comfortableDensity }
							>
								<Menu.ItemLabel>Comfortable</Menu.ItemLabel>
								<Menu.ItemDescription>
									Show more spacing between rows.
								</Menu.ItemDescription>
							</Menu.RadioItem>
							<Menu.RadioItem value="spacious">
								<Menu.ItemLabel>Spacious</Menu.ItemLabel>
								<Menu.ItemDescription>
									Show the largest row spacing.
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
