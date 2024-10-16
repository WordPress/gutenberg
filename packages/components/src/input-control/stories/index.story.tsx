/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { closeSmall, Icon, link, seen, unseen } from '@wordpress/icons';
import { useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import InputControl from '..';
import { InputControlPrefixWrapper } from '../input-prefix-wrapper';
import { InputControlSuffixWrapper } from '../input-suffix-wrapper';
import Button from '../../button';

const meta: Meta< typeof InputControl > = {
	title: 'Components (Experimental)/InputControl',
	component: InputControl,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
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
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof InputControl > = ( args ) => (
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

/**
 * `<InputControlPrefixWrapper>` and `<InputControlSuffixWrapper>` have a `variant` prop that can be used to
 * adjust the wrapper based on the prefix or suffix content.
 *
 * - `'default'`: Standard padding for text content.
 * - `'icon'`: For icons.
 * - `'control'`: For controls, like buttons or selects.
 */
export const WithIconOrControl = Template.bind( {} );
WithIconOrControl.args = {
	...Default.args,
	prefix: (
		<InputControlPrefixWrapper variant="icon">
			<Icon icon={ link } />
		</InputControlPrefixWrapper>
	),
	suffix: (
		<InputControlSuffixWrapper variant="control">
			<Button icon={ closeSmall } size="small" label="Clear" />
		</InputControlSuffixWrapper>
	),
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

export const ShowPassword: StoryFn< typeof InputControl > = ( args ) => {
	const [ visible, setVisible ] = useState( false );
	return (
		<InputControl
			type={ visible ? 'text' : 'password' }
			label="Password"
			suffix={
				<InputControlSuffixWrapper variant="control">
					<Button
						size="small"
						icon={ visible ? unseen : seen }
						onClick={ () => setVisible( ( value ) => ! value ) }
						label={ visible ? 'Hide password' : 'Show password' }
					/>
				</InputControlSuffixWrapper>
			}
			{ ...args }
		/>
	);
};
