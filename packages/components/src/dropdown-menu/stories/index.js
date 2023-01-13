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
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const Template = ( props ) => <DropdownMenu { ...props } />;

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
	toggleProps: {
		showTooltip: true,
	},
};

export const WithChildren = Template.bind( {} );
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
