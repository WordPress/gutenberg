import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Knob } from '../index';
import { InputControl } from '../../form/input-control';
import { InputLayout } from '../../form/primitives/input-layout';
import { Stack } from '../../stack';

const meta: Meta< typeof Knob > = {
	title: 'Components/@wordpress-ui/Knob',
	id: 'design-system-components-knob',
	component: Knob,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
	argTypes: {
		value: { control: false },
		defaultValue: { control: false },
		onValueChange: { action: 'onValueChange' },
	},
	args: { 'aria-label': 'Angle' },
};
export default meta;

type Story = StoryObj< typeof Knob >;

/** Without `min` and `max`, dragging past the top wraps from 359 to 0. */
export const Default: Story = {
	args: { defaultValue: 90 },
};

/** `min` and `max` stop the dial at the ends instead of wrapping. */
export const WithStops: Story = {
	args: { defaultValue: 45, min: 0, max: 180 },
};

/**
 * A range wider than one turn counts turns while dragging. A click picks the
 * angle nearest the current value, so it never jumps a whole turn.
 */
export const MultipleTurns: Story = {
	args: { defaultValue: 0, min: -360, max: 360 },
};

/** An empty value shows no indicator. The first change sets one. */
export const Empty: Story = {
	args: { defaultValue: null },
};

export const Disabled: Story = {
	args: { defaultValue: 90, disabled: true },
};

/**
 * Knob is a dial only. Compose it with `InputControl` to let users type an
 * exact angle, keeping both in sync through a shared value.
 */
export const WithInputControl: Story = {
	render: function Template( args ) {
		const [ angle, setAngle ] = useState< number | null >( 90 );

		return (
			<Stack direction="row" gap="sm" align="end">
				<InputControl
					label="Angle"
					type="number"
					min={ args.min }
					max={ args.max }
					value={ angle ?? '' }
					onValueChange={ ( nextValue ) =>
						setAngle(
							nextValue === '' ? null : parseFloat( nextValue )
						)
					}
					suffix={ <InputLayout.Slot>°</InputLayout.Slot> }
				/>
				<Knob { ...args } value={ angle } onValueChange={ setAngle } />
			</Stack>
		);
	},
};
