import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import MenuGroup from '..';
import MenuItem from '../../menu-item';
import MenuItemsChoice from '../../menu-items-choice';
import { NavigableMenu } from '../../navigable-container';

const meta: Meta< typeof MenuGroup > = {
	tags: [ 'manifest' ],
	title: 'Components/Actions/MenuGroup',
	component: MenuGroup,
	id: 'components-menugroup',
	argTypes: {
		children: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Subcomponent of `DropdownMenu`.',
		},
	},
};
export default meta;

const Template: StoryFn< typeof MenuGroup > = ( args ) => {
	return (
		<NavigableMenu>
			<MenuGroup { ...args }>
				<MenuItem>Menu Item 1</MenuItem>
				<MenuItem>Menu Item 2</MenuItem>
			</MenuGroup>
		</NavigableMenu>
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
		<NavigableMenu>
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
		</NavigableMenu>
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
