/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import { DropdownMenu } from '..';
import MenuItem from '../../menu-item';
import MenuGroup from '../../menu-group';

/**
 * WordPress dependencies
 */
import {
	menu,
	arrowUp,
	arrowDown,
	chevronDown,
	more,
	trash,
} from '@wordpress/icons';

const meta: Meta< typeof DropdownMenu > = {
	title: 'Components/Actions/DropdownMenu',
	component: DropdownMenu,
	id: 'components-dropdownmenu',
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	argTypes: {
		icon: {
			options: [ 'menu', 'chevronDown', 'more' ],
			mapping: { menu, chevronDown, more },
			control: { type: 'select' },
		},
		open: { control: false },
		defaultOpen: { control: false },
		onToggle: { control: false },
	},
};
export default meta;

export const Default: StoryObj< typeof DropdownMenu > = {
	args: {
		label: 'Select a direction.',
		icon: menu,
		controls: [
			{
				title: 'First Menu Item Label',
				icon: arrowUp,
				// eslint-disable-next-line no-console
				onClick: () => console.log( 'up!' ),
			},
			{
				title: 'Second Menu Item Label',
				icon: arrowDown,
				// eslint-disable-next-line no-console
				onClick: () => console.log( 'down!' ),
			},
		],
	},
};

export const WithChildren: StoryObj< typeof DropdownMenu > = {
	...Default,
	// Adding custom source because Storybook is not able to show the contents of
	// the `children` prop correctly in the code snippet.
	parameters: {
		docs: {
			source: {
				code: `<DropdownMenu label="Select a direction." icon={ more }>
  <MenuGroup>
    <MenuItem icon={ arrowUp } onClick={ onClose }>
      Move Up
    </MenuItem>
    <MenuItem icon={ arrowDown } onClick={ onClose }>
      Move Down
    </MenuItem>
  </MenuGroup>
  <MenuGroup>
    <MenuItem icon={ trash } onClick={ onClose }>
      Remove
    </MenuItem>
  </MenuGroup>
</DropdownMenu>`,
				language: 'jsx',
				type: 'auto',
			},
		},
	},
	args: {
		label: 'Select a direction.',
		icon: more,
		children: ( { onClose } ) => (
			<>
				<MenuItem icon={ arrowUp } onClick={ onClose }>
					Standalone Item
				</MenuItem>
				<MenuGroup>
					<MenuItem icon={ arrowUp } onClick={ onClose }>
						Move Up
					</MenuItem>
					<MenuItem icon={ arrowDown } onClick={ onClose }>
						Move Down
					</MenuItem>
				</MenuGroup>
				<MenuGroup>
					<MenuItem icon={ trash } onClick={ onClose }>
						Remove
					</MenuItem>
				</MenuGroup>
			</>
		),
	},
};
