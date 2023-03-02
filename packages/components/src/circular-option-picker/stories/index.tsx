/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { useState, createContext, useContext } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	default as CircularOptionPicker,
	ButtonAction,
	DropdownLinkAction,
	Option,
} from '..';

const CircularOptionPickerStoryContext = createContext< {
	currentColor?: string;
	setCurrentColor?: ( v: string | undefined ) => void;
} >( {} );

const meta: ComponentMeta< typeof CircularOptionPicker > = {
	title: 'Components/CircularOptionPicker',
	component: CircularOptionPicker,
	subcomponents: {
		'CircularOptionPicker.Option': Option,
		'CircularOptionPicker.ButtonAction': ButtonAction,
		'CircularOptionPicker.DropdownLinkAction': DropdownLinkAction,
	},
	argTypes: {
		actions: { control: { type: null } },
		options: { control: { type: null } },
		children: { control: { type: 'text' } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open', excludeDecorators: true } },
	},
	decorators: [
		// Share current color state between main component, `actions` and `options`
		( Story ) => {
			const [ currentColor, setCurrentColor ] = useState< string >();

			return (
				<CircularOptionPickerStoryContext.Provider
					value={ {
						currentColor,
						setCurrentColor,
					} }
				>
					<Story />
				</CircularOptionPickerStoryContext.Provider>
			);
		},
	],
};
export default meta;

const colors = [
	{ color: '#f00', name: 'Red' },
	{ color: '#0f0', name: 'Green' },
	{ color: '#0af', name: 'Blue' },
];

const DefaultOptions = () => {
	const { currentColor, setCurrentColor } = useContext(
		CircularOptionPickerStoryContext
	);

	return (
		<>
			{ colors.map( ( { color, name }, index ) => {
				return (
					<CircularOptionPicker.Option
						key={ `${ color }-${ index }` }
						tooltipText={ name }
						style={ { backgroundColor: color, color } }
						isSelected={ color === currentColor }
						onClick={ () => {
							setCurrentColor?.( color );
						} }
						aria-label={ name }
					/>
				);
			} ) }
		</>
	);
};

const DefaultActions = () => {
	const { setCurrentColor } = useContext( CircularOptionPickerStoryContext );

	return (
		<CircularOptionPicker.ButtonAction
			onClick={ () => setCurrentColor?.( undefined ) }
		>
			{ 'Clear' }
		</CircularOptionPicker.ButtonAction>
	);
};

const Template: ComponentStory< typeof CircularOptionPicker > = ( props ) => (
	<CircularOptionPicker { ...props } />
);

export const Default = Template.bind( {} );
Default.args = { options: <DefaultOptions /> };

export const WithButtonAction = Template.bind( {} );
WithButtonAction.args = {
	...Default.args,
	actions: <DefaultActions />,
};
WithButtonAction.storyName = 'With ButtonAction';

export const WithDropdownLinkAction = Template.bind( {} );
WithDropdownLinkAction.args = {
	...Default.args,
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
