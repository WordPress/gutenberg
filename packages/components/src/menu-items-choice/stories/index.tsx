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
	argTypes: {},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof MenuItemsChoice > = ( args ) => {
	const [ choice, setChoice ] = useState( args.value ?? '' );
	const [ hovered, setHovered ] = useState< string | undefined >();

	return (
		<MenuGroup label="Editor">
			<MenuItemsChoice
				{ ...args }
				value={ choice }
				onSelect={ ( value ) => setChoice( value ) }
				onHover={ ( value ) => setHovered( value ) }
			/>
			<div>Currently hovered value: { hovered ? hovered : '-' }</div>
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
