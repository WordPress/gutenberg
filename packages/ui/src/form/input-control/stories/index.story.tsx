import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { plus, reset, seen, unseen } from '@wordpress/icons';
import { IconButton, InputControl, InputLayout, Stack } from '../../..';
import {
	WithPrefix,
	WithSuffixControl,
} from '../../primitives/input/stories/index.story';
import {
	WITH_DETAILS_DESCRIPTION,
	DETAILS_EXAMPLE,
} from '../../stories/shared';

const meta: Meta< typeof InputControl > = {
	title: 'Design System/Components/Form/InputControl',
	component: InputControl,
	argTypes: {
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
		value: { control: false },
		type: { control: 'text' },
	},
};
export default meta;

type Story = StoryObj< typeof InputControl >;

export const Default: Story = {
	args: {
		label: 'Label',
		description: 'This is the description.',
		placeholder: 'Placeholder',
	},
};

export const VisuallyHiddenLabel: Story = {
	args: {
		...Default.args,
		hideLabelFromVision: true,
	},
};

export const WithDetails: Story = {
	parameters: {
		docs: { description: { story: WITH_DETAILS_DESCRIPTION } },
	},
	args: {
		...Default.args,
		description: undefined,
		details: DETAILS_EXAMPLE,
	},
};

WithPrefix.args = {
	...WithPrefix.args,
	...Default.args,
};
WithSuffixControl.args = {
	...WithSuffixControl.args,
	...Default.args,
};
export { WithPrefix, WithSuffixControl };

export const Password: Story = {
	render: function Template( args ) {
		const [ show, setShow ] = useState( false );

		return (
			<InputControl
				{ ...args }
				type={ show ? 'text' : 'password' }
				suffix={
					<InputLayout.Slot padding="minimal">
						<IconButton
							label={ show ? 'Hide password' : 'Show password' }
							onClick={ () => setShow( ! show ) }
							icon={ show ? unseen : seen }
							size="small"
							variant="minimal"
						/>
					</InputLayout.Slot>
				}
			/>
		);
	},
	args: {
		...Default.args,
		defaultValue: 'password',
	},
};

export const Date: Story = {
	args: {
		...Default.args,
		type: 'date',
	},
};

export const Number: Story = {
	args: {
		...Default.args,
		placeholder: '0',
		type: 'number',
	},
};

export const NumberWithSteppers: Story = {
	render: function Template( args ) {
		const [ value, setValue ] = useState( 0 );

		return (
			<>
				<style>
					{ `
					  .my-number-with-steppers input[type='number'] {
							-moz-appearance: textfield;
					  }
						.my-number-with-steppers ::-webkit-inner-spin-button {
							appearance: none;
						}
					` }
				</style>
				<InputControl
					{ ...args }
					value={ value }
					onValueChange={ ( v ) => setValue( parseInt( v, 10 ) ) }
					className="my-number-with-steppers"
					suffix={
						<InputLayout.Slot padding="minimal">
							<Stack direction="row" gap="xs">
								<IconButton
									label="Increment"
									icon={ plus }
									onClick={ () => setValue( value + 1 ) }
									size="small"
									variant="minimal"
								/>
								<IconButton
									label="Decrement"
									icon={ reset }
									onClick={ () => setValue( value - 1 ) }
									size="small"
									variant="minimal"
								/>
							</Stack>
						</InputLayout.Slot>
					}
				/>
			</>
		);
	},
	args: {
		...Number.args,
		type: 'number',
	},
};

export const Disabled: Story = {
	args: {
		...Default.args,
		disabled: true,
	},
};
