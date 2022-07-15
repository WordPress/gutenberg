/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import InputControl from '..';
import { InputControlPrefix } from '../input-prefix';
import { InputControlSuffix } from '../input-suffix';

const meta: ComponentMeta< typeof InputControl > = {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	subcomponents: { InputControlPrefix, InputControlSuffix },
	argTypes: {
		__unstableInputWidth: { control: { type: 'text' } },
		__unstableStateReducer: { control: { type: null } },
		onChange: { control: { type: null } },
		prefix: { control: { type: null } },
		suffix: { control: { type: null } },
		type: { control: { type: 'text' } },
		value: { control: { disable: true } },
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
};

/**
 * A `prefix` can be inserted before the input. By default, the prefix is aligned with the edge of the input border,
 * with no padding. If you want to apply standard padding in accordance with the size variant, use the provided
 * `<InputControlPrefix>` convenience wrapper.
 */
export const WithPrefix = Template.bind( {} );
WithPrefix.args = {
	...Default.args,
	prefix: <InputControlPrefix>@</InputControlPrefix>,
};

/**
 * A `suffix` can be inserted after the input. By default, the suffix is aligned with the edge of the input border,
 * with no padding. If you want to apply standard padding in accordance with the size variant, use the provided
 * `<InputControlSuffix>` convenience wrapper.
 */
export const WithSuffix = Template.bind( {} );
WithSuffix.args = {
	...Default.args,
	suffix: <InputControlSuffix>%</InputControlSuffix>,
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
