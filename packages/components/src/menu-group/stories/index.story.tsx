/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MenuGroup from '..';
import MenuItem from '../../menu-item';
import MenuItemsChoice from '../../menu-items-choice';

/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

const meta: Meta< typeof MenuGroup > = {
	title: 'Components/Actions/MenuGroup',
	component: MenuGroup,
	id: 'components-menugroup',
	argTypes: {
		children: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof MenuGroup > = ( args ) => {
	return (
		<MenuGroup { ...args }>
			<MenuItem>Menu Item 1</MenuItem>
			<MenuItem>Menu Item 2</MenuItem>
		</MenuGroup>
	);
};

export const Default: StoryFn< typeof MenuGroup > = Template.bind( {} );

const MultiGroupsTemplate: StoryFn< typeof MenuGroup > = ( args ) => {
	const [ mode, setMode ] = useState( 'visual' );
	const choices = [
		{
			value: 'visual',
			label: 'Visual editor',
		},
		{
			value: 'text',
			label: 'Code editor',
		},
	];

	return (
		<>
			<MenuGroup label="View">
				<MenuItem>Top Toolbar</MenuItem>
				<MenuItem>Spotlight Mode</MenuItem>
				<MenuItem>Distraction Free</MenuItem>
			</MenuGroup>
			<MenuGroup { ...args }>
				<MenuItemsChoice
					choices={ choices }
					value={ mode }
					onSelect={ ( newMode: string ) => setMode( newMode ) }
					onHover={ () => {} }
				/>
			</MenuGroup>
		</>
	);
};

/**
 * When other menu items exist above or below a MenuGroup, the group
 * should have a divider line between it and the adjacent item.
 */
export const WithSeparator = MultiGroupsTemplate.bind( {} );
WithSeparator.args = {
	...Default.args,
	hideSeparator: false,
	label: 'Editor',
};
