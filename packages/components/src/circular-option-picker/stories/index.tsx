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
import CircularOptionPicker from '..';

const meta: ComponentMeta< typeof CircularOptionPicker > = {
	title: 'Components/CircularOptionPicker',
	component: CircularOptionPicker,
	argTypes: {
		actions: { control: { type: null } },
		options: { control: { type: null } },
		children: { control: { type: 'text' } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const colors = [
	{ color: '#f00', name: 'Red' },
	{ color: '#0f0', name: 'Green' },
	{ color: '#0af', name: 'Blue' },
];

// TODO: ask if there's a more elegant way to access a state handler from a second story
let resetColor: React.Dispatch< React.SetStateAction< number | undefined > >;

const Template: ComponentStory< typeof CircularOptionPicker > = ( props ) => {
	const [ currentColor, setCurrentColor ] = useState< number >();
	resetColor = setCurrentColor;

	const colorOptions = (
		<>
			{ colors.map( ( { color, name }, index ) => {
				return (
					<CircularOptionPicker.Option
						key={ `${ color }-${ index }` }
						tooltipText={ name }
						style={ { backgroundColor: color, color } }
						isSelected={ index === currentColor }
						onClick={ () => setCurrentColor( index ) }
						aria-label={ name }
					/>
				);
			} ) }
		</>
	);
	return <CircularOptionPicker { ...props } options={ colorOptions } />;
};

export const Default = Template.bind( {} );
Default.args = { actions: <></> };

export const WithButtonAction = Template.bind( {} );
WithButtonAction.args = {
	actions: (
		<CircularOptionPicker.ButtonAction
			onClick={ () => resetColor( undefined ) }
		>
			{ 'Clear' }
		</CircularOptionPicker.ButtonAction>
	),
};
WithButtonAction.storyName = 'With ButtonAction';

export const WithDropdownLinkAction = Template.bind( {} );
WithDropdownLinkAction.args = {
	actions: (
		<CircularOptionPicker.DropdownLinkAction
			dropdownProps={ {
				popoverProps: { position: 'top right' },
				renderContent: () => (
					<div>This is an example of a DropdownLinkAction.</div>
				),
			} }
			linkText="Learn More"
		></CircularOptionPicker.DropdownLinkAction>
	),
};
WithDropdownLinkAction.storyName = 'With DropdownLinkAction';
