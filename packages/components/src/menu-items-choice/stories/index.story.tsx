import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import MenuItemsChoice from '..';
import MenuGroup from '../../menu-group';
import { NavigableMenu } from '../../navigable-container';

const meta: Meta< typeof MenuItemsChoice > = {
	tags: [ 'manifest' ],
	component: MenuItemsChoice,
	title: 'Components/Actions/MenuItemsChoice',
	id: 'components-menuitemschoice',
	argTypes: {
		onHover: { action: 'onHover' },
		onSelect: { action: 'onSelect' },
		value: { control: false },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Subcomponent of `DropdownMenu`.',
		},
		// FIXME: Stories render menuitemradio outside a menu parent (aria-required-parent). Update examples to compose inside DropdownMenu (or NavigableMenu) so they match real usage.
		// See: https://github.com/WordPress/gutenberg/issues/81596
		a11y: { test: 'todo' },
	},
};
export default meta;

const Template: StoryFn< typeof MenuItemsChoice > = ( {
	onHover,
	onSelect,
	choices,
} ) => {
	const [ choice, setChoice ] = useState( choices[ 0 ]?.value ?? '' );

	return (
		<NavigableMenu>
			<MenuGroup label="Editor">
				<MenuItemsChoice
					choices={ choices }
					value={ choice }
					onSelect={ ( ...selectArgs ) => {
						onSelect( ...selectArgs );
						setChoice( ...selectArgs );
					} }
					onHover={ onHover }
				/>
			</MenuGroup>
		</NavigableMenu>
	);
};

export const Default: StoryFn< typeof MenuItemsChoice > = Template.bind( {} );

Default.args = {
	choices: [
		{
			value: 'arbitrary-choice-1',
			label: 'Arbitrary Label #1',
			info: 'Arbitrary Explanatory 1',
		},
		{
			value: 'arbitrary-choice-2',
			label: 'Arbitrary Label #2',
			info: 'Arbitrary Explanatory 2',
		},
		{
			value: 'arbitrary-choice-3',
			label: 'Arbitrary Label #3',
			info: 'Arbitrary Explanatory 3',
		},
	],
	value: 'arbitrary-choice-1',
};
