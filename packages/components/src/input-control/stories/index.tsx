/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import InputControl from '..';

const meta: ComponentMeta< typeof InputControl > = {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	argTypes: {
		__unstableInputWidth: { control: { type: 'text' } },
		__unstableStateReducer: { control: { type: null } },
		onChange: { control: { type: null } },
		prefix: { control: { type: null } },
		suffix: { control: { type: null } },
		type: { control: { type: 'text' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof InputControl > = ( args ) => (
	<InputControl { ...args } />
);

export const Default = Template.bind( {} );
Default.args = {
	label: 'Value',
	placeholder: 'Placeholder',
	value: '',
};

export const WithPrefix = Template.bind( {} );
WithPrefix.args = {
	...Default.args,
	prefix: <span style={ { paddingLeft: 8 } }>@</span>,
};

export const WithSuffix = Template.bind( {} );
WithSuffix.args = {
	...Default.args,
	suffix: <button style={ { marginRight: 4 } }>Send</button>,
};

export const WithSideLabel = Template.bind( {} );
WithSideLabel.args = {
	...Default.args,
	labelPosition: 'side',
};

export const WithEdgeLabel = Template.bind( {} );
WithEdgeLabel.args = {
	...Default.args,
	__unstableInputWidth: '20em',
	labelPosition: 'edge',
};
