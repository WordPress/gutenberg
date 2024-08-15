/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { seen, unseen } from '@wordpress/icons';
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
				<InputControlSuffixWrapper>
					<div style={ { display: 'flex' } }>
						<Button
							size="small"
							icon={ visible ? unseen : seen }
							onClick={ () => setVisible( ( value ) => ! value ) }
							label={
								visible ? 'Hide password' : 'Show password'
							}
						/>
					</div>
				</InputControlSuffixWrapper>
			}
			{ ...args }
		/>
	);
};
