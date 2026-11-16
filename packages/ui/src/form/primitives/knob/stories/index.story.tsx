import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Stack } from '../../../../stack';
import { Text } from '../../../../text';
import * as Field from '../../field';
import { Knob } from '../index';

const meta: Meta< typeof Knob > = {
	title: 'Components/@wordpress-ui/Form/Primitives/Knob',
	id: 'design-system-components-form-primitives-knob',
	component: Knob,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
	argTypes: {
		onValueChange: { action: 'onValueChange' },
	},
};
export default meta;

type Story = StoryObj< typeof Knob >;

export const Default: Story = {
	args: {
		'aria-label': 'Opacity',
		defaultValue: 65,
		format: { style: 'unit', unit: 'percent' },
	},
};

/** A full turn contains 360 distinct whole-degree values, including zero. */
export const Wrapping: Story = {
	args: {
		'aria-label': 'Gradient angle',
		max: 359,
		wrap: true,
		defaultValue: 315,
		format: { style: 'unit', unit: 'degree', unitDisplay: 'long' },
	},
};

export const Disabled: Story = {
	args: { ...Default.args, disabled: true },
};

/** Field supplies the dial's accessible name and description. The visible readout shares its controlled value. */
export const WithField: Story = {
	args: {
		max: 359,
		wrap: true,
		format: { style: 'unit', unit: 'degree', unitDisplay: 'long' },
	},
	render: function GradientAngleField( { onValueChange, ...args } ) {
		const [ angle, setAngle ] = useState( 45 );
		return (
			<Field.Root name="angle">
				<Field.Label>Gradient angle</Field.Label>
				<Stack gap="sm" align="center">
					<Knob
						{ ...args }
						value={ angle }
						onValueChange={ ( next ) => {
							setAngle( next );
							onValueChange?.( next );
						} }
					/>
					<Text aria-hidden="true">{ angle }°</Text>
				</Stack>
				<Field.Description>
					Choose the direction of the gradient.
				</Field.Description>
			</Field.Root>
		);
	},
};
