/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MenuItemsChoice from '..';
import MenuGroup from '../../menu-group';

const meta: ComponentMeta< typeof MenuItemsChoice > = {
	component: MenuItemsChoice,
	title: 'Components/MenuItemsChoice',
	argTypes: {
		onHover: { action: 'onHover' },
		onSelect: { action: 'onSelect' },
		value: { control: { type: null } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof MenuItemsChoice > = ( {
	onHover,
	onSelect,
	choices,
} ) => {
	const [ choice, setChoice ] = useState( choices[ 0 ]?.value ?? '' );

	return (
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
	);
};

export const Default: ComponentStory< typeof MenuItemsChoice > = Template.bind(
	{}
);

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
