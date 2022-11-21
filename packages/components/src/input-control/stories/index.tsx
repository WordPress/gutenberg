/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import InputControl from '..';
import { InputControlPrefixWrapper } from '../input-prefix-wrapper';
import { InputControlSuffixWrapper } from '../input-suffix-wrapper';

const meta: ComponentMeta< typeof InputControl > = {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	subcomponents: { InputControlPrefixWrapper, InputControlSuffixWrapper },
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

export const WithHelpText = Template.bind( {} );
WithHelpText.args = {
	...Default.args,
	help: 'Help text to describe the control.',
};

/**
 * A `prefix` can be inserted before the input. By default, the prefix is aligned with the edge of the input border,
 * with no padding. If you want to apply standard padding in accordance with the size variant, use the provided
 * `<InputControlPrefixWrapper>` convenience wrapper.
 */
export const WithPrefix = Template.bind( {} );
WithPrefix.args = {
	...Default.args,
	prefix: <InputControlPrefixWrapper>@</InputControlPrefixWrapper>,
};

/**
 * A `suffix` can be inserted after the input. By default, the suffix is aligned with the edge of the input border,
 * with no padding. If you want to apply standard padding in accordance with the size variant, use the provided
 * `<InputControlSuffixWrapper>` convenience wrapper.
 */
export const WithSuffix = Template.bind( {} );
WithSuffix.args = {
	...Default.args,
	suffix: <InputControlSuffixWrapper>%</InputControlSuffixWrapper>,
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
