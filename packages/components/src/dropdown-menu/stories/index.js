/**
 * Internal dependencies
 */
import DropdownMenu from '../';

/**
 * WordPress dependencies
 */
import { menu, arrowUp, arrowDown, chevronDown } from '@wordpress/icons';

export default {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
	argTypes: {
		className: { control: { type: 'text' } },
		disableOpenOnArrowDown: { control: { type: 'boolean' } },
		icon: {
			options: [ 'menu', 'chevronDown' ],
			mapping: { menu, chevronDown },
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
