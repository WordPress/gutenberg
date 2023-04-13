/**
 * Internal dependencies
 */
import DropdownMenu from '../';
import { MenuGroup, MenuItem } from '../../';

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

export default {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
	argTypes: {
		className: { control: { type: 'text' } },
		children: { control: { type: null } },
		disableOpenOnArrowDown: { control: { type: 'boolean' } },
		icon: {
			options: [ 'menu', 'chevronDown', 'more' ],
			mapping: { menu, chevronDown, more },
			control: { type: 'select' },
		},
		menuProps: {
			control: { type: 'object' },
		},
		noIcons: { control: { type: 'boolean' } },
		popoverProps: {
			control: { type: 'object' },
		},
		text: { control: { type: 'text' } },
		toggleProps: {
			control: { type: 'object' },
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const Template = ( props ) => (
	<div style={ { height: 150 } }>
		<DropdownMenu { ...props } />
	</div>
);

export const Default = Template.bind( {} );
Default.args = {
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
};

export const WithChildren = Template.bind( {} );
// Adding custom source because Storybook is not able to show the contents of
// the `children` prop correctly in the code snippet.
WithChildren.parameters = {
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
};
WithChildren.args = {
	label: 'Select a direction.',
	icon: more,
	children: ( { onClose } ) => (
		<>
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
};
