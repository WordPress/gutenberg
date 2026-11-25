import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { useId, useState } from '@wordpress/element';
import { Stack } from '../../../../stack';
import { Text } from '../../../../text';
import { InputControl } from '../../../input-control';
import { SelectControl } from '../../../select-control';
import { InputLayout } from '../../input-layout';
import { Knob } from '../index';

const meta: Meta< typeof Knob > = {
	title: 'Components/@wordpress-ui/Form/Primitives/Knob',
	id: 'design-system-components-form-primitives-knob',
	component: Knob,
	argTypes: {
		onValueChange: { action: 'onValueChange' },
		stepsPerTurn: { control: false },
		value: { control: false },
	},
};
export default meta;

type Story = StoryObj< typeof Knob >;

const DEGREES = {
	style: 'unit',
	unit: 'degree',
	unitDisplay: 'long',
} as const;

/**
 * The number field keeps the value. The dial points to the same heading and
 * wraps it onto one turn, so 450 points where 90 does.
 */
export const WithNumberInput: Story = {
	args: { format: DEGREES },
	render: function GradientAngle( { onValueChange, name, form, ...args } ) {
		const [ angle, setAngle ] = useState( 135 );
		const [ draft, setDraft ] = useState< string >();
		return (
			<Stack direction="row" gap="sm" align="flex-end">
				<InputControl
					label="Gradient angle"
					name={ name }
					form={ form }
					type="number"
					suffix={ <InputLayout.Slot>°</InputLayout.Slot> }
					disabled={ args.disabled }
					value={ draft ?? angle }
					onChange={ ( { currentTarget } ) => {
						setDraft( currentTarget.value );
						if ( currentTarget.value !== '' ) {
							setAngle( currentTarget.valueAsNumber );
						}
					} }
					onBlur={ () => setDraft( undefined ) }
				/>
				<Knob
					{ ...args }
					stepsPerTurn={ 360 }
					aria-label="Gradient angle dial"
					value={ angle }
					onValueChange={ ( next ) => {
						setAngle( next );
						onValueChange?.( next );
					} }
				/>
			</Stack>
		);
	},
};

export const Disabled: Story = {
	...WithNumberInput,
	args: { ...WithNumberInput.args, disabled: true },
};

/**
 * An unset rotation shows the inherited angle as the field's placeholder and
 * as a hollow dot on the dial, which reads “45 degrees, inherited”. Clearing
 * the field restores it. Entering zero sets an explicit 0°.
 */
export const WithInheritedValue: Story = {
	args: { min: -720, max: 720, format: DEGREES },
	render: function Rotation( { onValueChange, name, form, ...args } ) {
		const inherited = 45;
		const numberHelpId = useId();
		const dialHelpId = useId();
		const [ rotation, setRotation ] = useState< number | null >( null );
		const [ draft, setDraft ] = useState< string >();
		return (
			<Stack direction="column" gap="sm">
				<Stack direction="row" gap="sm" align="flex-end">
					<InputControl
						label="Rotation"
						name={ name }
						form={ form }
						type="number"
						suffix={ <InputLayout.Slot>°</InputLayout.Slot> }
						min={ args.min }
						max={ args.max }
						disabled={ args.disabled }
						aria-describedby={ numberHelpId }
						placeholder={ String( inherited ) }
						value={ draft ?? rotation ?? '' }
						onChange={ ( { currentTarget } ) => {
							setDraft( currentTarget.value );
							if ( currentTarget.validity.valid ) {
								setRotation(
									currentTarget.value === ''
										? null
										: currentTarget.valueAsNumber
								);
							}
						} }
						onBlur={ () => setDraft( undefined ) }
					/>
					<Knob
						{ ...args }
						stepsPerTurn={ 360 }
						aria-label="Rotation dial"
						aria-describedby={ dialHelpId }
						value={ rotation }
						placeholder={ inherited }
						getAriaValueText={
							rotation === null
								? ( formatted ) => `${ formatted }, inherited`
								: undefined
						}
						onValueChange={ ( next ) => {
							setRotation( next );
							onValueChange?.( next );
						} }
					/>
				</Stack>
				<Text variant="body-sm">
					<span id={ dialHelpId }>
						The dial adjusts the same rotation as the number field.
					</span>{ ' ' }
					<span id={ numberHelpId }>
						Clear the field to use the inherited { inherited }°.
					</span>
				</Text>
			</Stack>
		);
	},
	play: async ( { canvas } ) => {
		const number = canvas.getByRole( 'spinbutton', { name: 'Rotation' } );
		const dial = canvas.getByRole( 'slider', { name: 'Rotation dial' } );
		await expect( number ).toHaveAccessibleDescription(
			/^Clear the field to use the inherited/
		);
		await expect( dial ).toHaveAccessibleDescription(
			'The dial adjusts the same rotation as the number field.'
		);
	},
};

const UNITS = [
	{ value: 'deg', label: 'deg', unitsPerTurn: 360, stepsPerUnit: 1 },
	{ value: 'grad', label: 'grad', unitsPerTurn: 400, stepsPerUnit: 1 },
	{ value: 'turn', label: 'turn', unitsPerTurn: 1, stepsPerUnit: 100 },
	{
		value: 'rad',
		label: 'rad',
		unitsPerTurn: 2 * Math.PI,
		stepsPerUnit: 100,
	},
];

/**
 * The dial counts in whole steps of a turn and knows no units. The control
 * around it converts: it keeps the rotation in turns, shows it in the chosen
 * unit, and gives the dial as many steps per turn as that unit needs. A quarter
 * turn clockwise reads 90 in degrees, 100 in gradians, 0.25 in turns, and 1.57
 * in radians.
 */
export const WithUnits: Story = {
	parameters: { controls: { disable: true } },
	render: function RotationWithUnits() {
		const [ unit, setUnit ] = useState( UNITS[ 0 ] );
		// Keep the rotation in turns, so changing the unit never rounds it.
		const [ turns, setTurns ] = useState( 0.25 );
		const [ draft, setDraft ] = useState< string >();
		// Use the same steps for both controls when they divide a full turn.
		// A turn contains a fractional number of hundredths of a radian, so
		// the dial uses degrees in that case.
		const fieldStepsPerTurn = unit.unitsPerTurn * unit.stepsPerUnit;
		const dialStepsPerTurn = Number.isInteger( fieldStepsPerTurn )
			? fieldStepsPerTurn
			: 360;
		const maxFieldSteps = Math.floor( 2 * fieldStepsPerTurn );
		const fieldSteps = Math.round( turns * fieldStepsPerTurn );
		const rotation =
			Math.max( -maxFieldSteps, Math.min( maxFieldSteps, fieldSteps ) ) /
			unit.stepsPerUnit;
		const limit = maxFieldSteps / unit.stepsPerUnit;
		return (
			<Stack direction="row" gap="sm" align="flex-end">
				<InputControl
					label="Rotation"
					type="number"
					min={ -limit }
					max={ limit }
					step={ 1 / unit.stepsPerUnit }
					value={ draft ?? rotation }
					onChange={ ( { currentTarget } ) => {
						setDraft( currentTarget.value );
						// Skip a value the step does not allow, so the field
						// never rounds away part of the rotation it keeps.
						if (
							currentTarget.value !== '' &&
							currentTarget.validity.valid
						) {
							setTurns(
								currentTarget.valueAsNumber / unit.unitsPerTurn
							);
						}
					} }
					onBlur={ () => setDraft( undefined ) }
				/>
				<SelectControl
					label="Unit"
					items={ UNITS }
					value={ unit }
					onValueChange={ ( next ) =>
						setUnit(
							UNITS.find(
								( item ) => item.value === next?.value
							) ?? unit
						)
					}
				/>
				<Knob
					aria-label="Rotation dial"
					min={ -2 * dialStepsPerTurn }
					max={ 2 * dialStepsPerTurn }
					stepsPerTurn={ dialStepsPerTurn }
					aria-valuetext={ `${ rotation } ${ unit.label }` }
					value={ turns * dialStepsPerTurn }
					onValueChange={ ( steps ) =>
						setTurns( steps / dialStepsPerTurn )
					}
				/>
			</Stack>
		);
	},
};
