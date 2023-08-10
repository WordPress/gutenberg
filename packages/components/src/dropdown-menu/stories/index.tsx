/**
 * External dependencies
 */
import type { ComponentMeta, Story } from '@storybook/react';
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

const meta: ComponentMeta< typeof DropdownMenu > = {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
	argTypes: {
		icon: {
			options: [ 'menu', 'chevronDown', 'more' ],
			mapping: { menu, chevronDown, more },
			control: { type: 'select' },
		},
	},
};
export default meta;

const Template: Story< typeof DropdownMenu > = ( props ) => (
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
