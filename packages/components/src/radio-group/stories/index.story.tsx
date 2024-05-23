/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { RadioGroup } from '..';
import { Radio } from '../radio';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const meta: Meta< typeof RadioGroup > = {
	title: 'Components (Deprecated)/RadioGroup',
	id: 'components-radiogroup',
	component: RadioGroup,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { Radio },
	argTypes: {
		onChange: { control: { type: null } },
		children: { control: { type: null } },
		checked: { control: { type: 'text' } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof RadioGroup > = ( props ) => {
	return <RadioGroup { ...props } />;
};

export const Default: StoryFn< typeof RadioGroup > = Template.bind( {} );
Default.args = {
	id: 'default-radiogroup',
	label: 'options',
	defaultChecked: 'option2',
	children: (
		<>
			<Radio value="option1">Option 1</Radio>
			<Radio value="option2">Option 2</Radio>
			<Radio value="option3">Option 3</Radio>
		</>
	),
};

export const Disabled: StoryFn< typeof RadioGroup > = Template.bind( {} );
Disabled.args = {
	...Default.args,
	id: 'disabled-radiogroup',
	disabled: true,
};

const ControlledTemplate: StoryFn< typeof RadioGroup > = ( {
	checked: checkedProp,
	onChange: onChangeProp,
	...props
} ) => {
	const [ checked, setChecked ] =
		useState< React.ComponentProps< typeof RadioGroup >[ 'checked' ] >(
			checkedProp
		);

	const onChange: typeof onChangeProp = ( value ) => {
		setChecked( value );
		onChangeProp?.( value );
	};

	return (
		<RadioGroup { ...props } onChange={ onChange } checked={ checked } />
	);
};

export const Controlled: StoryFn< typeof RadioGroup > = ControlledTemplate.bind(
	{}
);
Controlled.args = {
	...Default.args,
	checked: 'option2',
	id: 'controlled-radiogroup',
};
Controlled.argTypes = {
	checked: { control: { type: null } },
};
