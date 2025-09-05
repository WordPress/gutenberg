/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Dropdown from '..';
import Button from '../../button';
import MenuGroup from '../../menu-group';
import MenuItem from '../../menu-item';
import { DropdownContentWrapper } from '../dropdown-content-wrapper';

const meta: Meta< typeof Dropdown > = {
	title: 'Components/Overlays/Dropdown',
	id: 'components-dropdown',
	component: Dropdown,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { DropdownContentWrapper },
	argTypes: {
		focusOnMount: {
			options: [ 'firstElement', true, false ],
			control: {
				type: 'radio',
			},
		},
		position: { control: false },
		renderContent: { control: false },
		renderToggle: { control: false },
		open: { control: false },
		defaultOpen: { control: false },
		onToggle: { control: false },
		onClose: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
	},
};
export default meta;

export const Default: StoryObj< typeof Dropdown > = {
	args: {
		renderToggle: ( { isOpen, onToggle } ) => (
			<Button
				onClick={ onToggle }
				aria-expanded={ isOpen }
				variant="primary"
			>
				Open dropdown
			</Button>
		),
		renderContent: () => <div>This is the dropdown content.</div>,
	},
};

/**
 * To apply more padding to the dropdown content, use the provided `<DropdownContentWrapper>`
 * convenience wrapper. A `paddingSize` of `"medium"` is suitable for relatively larger dropdowns (default is `"small"`).
 */
export const WithMorePadding: StoryObj< typeof Dropdown > = {
	...Default,
	args: {
		...Default.args,
		renderContent: () => (
			<DropdownContentWrapper paddingSize="medium">
				{ /* eslint-disable react/no-unescaped-entities */ }
				Content wrapped with <code>paddingSize="medium"</code>.
				{ /* eslint-enable react/no-unescaped-entities */ }
			</DropdownContentWrapper>
		),
	},
};

/**
 * The `<DropdownContentWrapper>` convenience wrapper can also be used to remove padding entirely,
 * with a `paddingSize` of `"none"`. This can also serve as a clean foundation to add arbitrary
 * paddings, for example when child components already have padding on their own.
 */
export const WithNoPadding: StoryObj< typeof Dropdown > = {
	...Default,
	args: {
		...Default.args,
		renderContent: () => (
			<DropdownContentWrapper paddingSize="none">
				{ /* eslint-disable react/no-unescaped-entities */ }
				Content wrapped with <code>paddingSize="none"</code>.
				{ /* eslint-enable react/no-unescaped-entities */ }
			</DropdownContentWrapper>
		),
	},
};

export const WithMenuItems: StoryObj< typeof Dropdown > = {
	...Default,
	args: {
		...Default.args,
		renderContent: () => (
			<>
				<MenuItem>Standalone Item</MenuItem>
				<MenuGroup label="Group 1">
					<MenuItem>Item 1</MenuItem>
					<MenuItem>Item 2</MenuItem>
				</MenuGroup>
				<MenuGroup label="Group 2">
					<MenuItem>Item 1</MenuItem>
					<MenuItem>Item 2</MenuItem>
				</MenuGroup>
			</>
		),
	},
};
