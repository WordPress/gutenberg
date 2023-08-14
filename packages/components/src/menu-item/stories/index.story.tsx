/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { link, more, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MenuGroup from '../../menu-group';
import MenuItem from '..';
import Shortcut from '../../shortcut';

const meta: Meta< typeof MenuItem > = {
	component: MenuItem,
	title: 'Components/MenuItem',
	argTypes: {
		children: { control: { type: null } },
		icon: {
			control: { type: 'select' },
			options: [ 'check', 'link', 'more' ],
			mapping: {
				check,
				link,
				more,
			},
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof MenuItem > = ( props ) => {
	return (
		<MenuGroup>
			<MenuItem { ...props }>Menu Item 1</MenuItem>
		</MenuGroup>
	);
};

export const Default: StoryFn< typeof MenuItem > = Template.bind( {} );

/**
 * When the `role` prop is either `"menuitemcheckbox"` or `"menuitemradio"`, the
 * `isSelected` prop should be used so screen readers can tell which item is currently selected.
 */
export const IsSelected = Template.bind( {} );
IsSelected.args = {
	...Default.args,
	isSelected: true,
	role: 'menuitemcheckbox',
};

export const WithIcon = Template.bind( {} );
WithIcon.args = {
	...Default.args,
	icon: link,
	iconPosition: 'left',
};

export const WithInfo = Template.bind( {} );
WithInfo.args = {
	...Default.args,
	info: 'Menu Item description',
};

export const WithSuffix = Template.bind( {} );
WithSuffix.args = {
	...Default.args,
	suffix: <Shortcut shortcut="Ctrl+M"></Shortcut>,
};
