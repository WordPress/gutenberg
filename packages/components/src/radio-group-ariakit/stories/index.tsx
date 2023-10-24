/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Radio, RadioGroup } from '..';

const meta: Meta< typeof RadioGroup > = {
	component: RadioGroup,
	title: 'Components (Deprecated)/RadioGroup (Ariakit)',
	// argTypes: {
	// 	value: { control: { type: 'number', min: 0, max: 100, step: 1 } },
	// },
	parameters: {
		controls: {
			expanded: true,
		},
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
