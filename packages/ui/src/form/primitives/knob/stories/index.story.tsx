import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { Stack } from '../../../../stack';
import { Text } from '../../../../text';
import { InputControl } from '../../../input-control';
import * as Field from '../../field';
import { Knob } from '../index';
import { getStepRange } from '../dial';
import type { KnobProps } from '../types';

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

function RangeExample( {
	label,
	description,
	unit,
	name,
	defaultValue = 0,
	onValueChange,
	...props
}: KnobProps & { label: string; description: string; unit?: string } ) {
	const [ requestedValue, setValue ] = useState( defaultValue );
	const value = getStepRange( props.min, props.max, props.step ).snap(
		requestedValue
	);
	return (
		<Field.Root name={ name }>
			<Field.Label>{ label }</Field.Label>
			<Stack gap="sm" align="center">
				<Knob
					{ ...props }
					value={ value }
					onValueChange={ ( next ) => {
						setValue( next );
						onValueChange?.( next );
					} }
				/>
				<Text aria-hidden="true">
					{ value }
					{ unit }
				</Text>
			</Stack>
			<Field.Description>{ description }</Field.Description>
		</Field.Root>
	);
}

/** Field supplies the dial's accessible name and description. The visible readout shares its controlled value. */
export const WithField: Story = {
	args: {
		name: 'angle',
		max: 359,
		wrap: true,
		defaultValue: 45,
		format: { style: 'unit', unit: 'degree', unitDisplay: 'long' },
	},
	render: ( args ) => (
		<RangeExample
			{ ...args }
			label="Gradient angle"
			description="Choose the direction of the gradient."
			unit="°"
		/>
	),
};

/** Compare a bounded amount with a wrapping angle at the same dial position. */
export const BoundedAndWrapping: Story = {
	parameters: { controls: { disable: true } },
	render: () => (
		<Stack direction="row" gap="xl" wrap="wrap">
			<RangeExample
				label="Opacity"
				description="Stops at 0% and 100%."
				defaultValue={ 50 }
				unit="%"
				format={ { style: 'unit', unit: 'percent' } }
			/>
			<RangeExample
				label="Gradient angle"
				description="Wraps from 359° to 0°."
				max={ 359 }
				wrap
				unit="°"
				format={ {
					style: 'unit',
					unit: 'degree',
					unitDisplay: 'long',
				} }
			/>
		</Stack>
	),
};

/** Compare three ways to map the same 0–500 range onto a dial. */
export const PartialTurns: Story = {
	parameters: { controls: { disable: true } },
	render: () => {
		const range = { min: 0, max: 500, defaultValue: 500 };
		return (
			<Stack direction="column" gap="lg">
				<RangeExample
					{ ...range }
					label="Bounded, 360 units per turn"
					description="The dial stops at 500, partway through the second turn."
					unitsPerTurn={ 360 }
				/>
				<RangeExample
					{ ...range }
					label="Wrapping, 360 units per turn"
					description="One step past 500 returns to zero at twelve o’clock."
					unitsPerTurn={ 360 }
					wrap
				/>
				<RangeExample
					{ ...range }
					label="Wrapping, one turn for the full range"
					description="All 501 steps share one turn. The last step sits beside zero."
					wrap
				/>
			</Stack>
		);
	},
};

/** Each step is an entire revolution. A readout distinguishes identical headings. */
export const WholeTurns: Story = {
	parameters: { controls: { disable: true } },
	render: () => (
		<RangeExample
			min={ -2 }
			max={ 2 }
			unitsPerTurn={ 1 }
			defaultValue={ 0 }
			label="Rotation (whole turns)"
			description="Tap the left half to subtract a turn or the right half to add one. Drag a full circle to change by one turn."
		/>
	),
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
		const range = getStepRange( args.min, args.max, args.step );
		const inheritedRotation = range.snap( 45 );
		const [ requestedRotation, setRotation ] = useState( defaultValue );
		const rotation =
			requestedRotation === undefined
				? undefined
				: range.snap( requestedRotation );
		const [ draft, setDraft ] = useState< string >();
		return (
			<Stack direction="column" gap="sm">
				<Stack direction="row" gap="sm" align="flex-end">
					<InputControl
						label="Rotation (degrees)"
						type="number"
						min={ args.min ?? 0 }
						max={ range.toValue( range.lastStep ) }
						step={ range.step }
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
					Clear the field to use the inherited { inheritedRotation }°.
				</Text>
			</Stack>
		);
	},
};
