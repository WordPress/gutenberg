/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import MenuItemsChoice from '..';
import MenuGroup from '../../menu-group';

const meta: Meta< typeof MenuItemsChoice > = {
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
		docs: { canvas: { sourceState: 'shown' } },
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
