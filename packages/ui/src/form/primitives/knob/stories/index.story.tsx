import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { Stack } from '../../../../stack';
import { Text } from '../../../../text';
import { InputControl } from '../../../input-control';
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

/** Type a precise rotation or turn the dial. Clearing the override restores the inherited angle. */
export const WithNumberInput: Story = {
	args: {
		min: -720,
		max: 720,
		unitsPerTurn: 360,
		defaultValue: 0,
		format: { style: 'unit', unit: 'degree', unitDisplay: 'long' },
	},
	render: function RotationField( { defaultValue, onValueChange, ...args } ) {
		const descriptionId = useId();
		const inheritedRotation = 45;
		const [ rotation, setRotation ] = useState( defaultValue );
		const [ draft, setDraft ] = useState< string >();
		return (
			<Stack direction="column" gap="sm">
				<Stack direction="row" gap="sm" align="flex-end">
					<InputControl
						label="Rotation (degrees)"
						type="number"
						min={ args.min }
						max={ args.max }
						step={ args.step }
						disabled={ args.disabled }
						aria-describedby={ descriptionId }
						placeholder={ String( inheritedRotation ) }
						value={ draft ?? rotation ?? '' }
						onChange={ ( { currentTarget } ) => {
							setDraft( currentTarget.value );
							if ( currentTarget.validity.valid ) {
								setRotation(
									currentTarget.value === ''
										? undefined
										: currentTarget.valueAsNumber
								);
							}
						} }
						onBlur={ () => setDraft( undefined ) }
					/>
					<Knob
						{ ...args }
						aria-label="Rotation (degrees)"
						aria-describedby={ descriptionId }
						value={ rotation ?? inheritedRotation }
						onValueChange={ ( next ) => {
							setRotation( next );
							onValueChange?.( next );
						} }
					/>
				</Stack>
				<Text id={ descriptionId } variant="body-sm">
					Clear the field to use the inherited 45°.
				</Text>
			</Stack>
		);
	},
};
