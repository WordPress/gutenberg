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
	component: RadioGroup,
	// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
	subcomponents: { Radio },
	argTypes: {
		onChange: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof RadioGroup > = () => {
	return (
		<RadioGroup
			// id is required for server side rendering
			// eslint-disable-next-line no-restricted-syntax
			id="default-radiogroup"
			label="options"
			defaultChecked="option2"
		>
			<Radio value="option1">Option 1</Radio>
			<Radio value="option2">Option 2</Radio>
			<Radio value="option3">Option 3</Radio>
		</RadioGroup>
	);
};

export const Disabled = () => {
	/* eslint-disable no-restricted-syntax */
	return (
		<RadioGroup
			// id is required for server side rendering
			id="disabled-radiogroup"
			disabled
			label="options"
			defaultChecked="option2"
		>
			<Radio value="option1">Option 1</Radio>
			<Radio value="option2">Option 2</Radio>
			<Radio value="option3">Option 3</Radio>
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};

const ControlledRadioGroupWithState = () => {
	const [ checked, setChecked ] =
		useState< React.ComponentProps< typeof RadioGroup >[ 'checked' ] >( 1 );

	/* eslint-disable no-restricted-syntax */
	return (
		<RadioGroup
			// id is required for server side rendering
			id="controlled-radiogroup"
			label="options"
			checked={ checked }
			onChange={ setChecked }
		>
			<Radio value={ 0 }>Option 1</Radio>
			<Radio value={ 1 }>Option 2</Radio>
			<Radio value={ 2 }>Option 3</Radio>
		</RadioGroup>
	);
	/* eslint-enable no-restricted-syntax */
};

export const Controlled = () => {
	return <ControlledRadioGroupWithState />;
};
