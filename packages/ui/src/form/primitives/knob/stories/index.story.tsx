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

/** Without `min` and `max`, the dial covers one turn and wraps from 359° to 0°. */
export const Default: Story = {
	args: {
		'aria-label': 'Gradient angle',
		defaultValue: 45,
		format: DEGREES,
	},
};

/** With `min` and `max`, the dial stops at both ends and counts the turns in between. */
export const Bounded: Story = {
	args: {
		'aria-label': 'Rotation',
		min: -720,
		max: 720,
		defaultValue: 0,
		format: DEGREES,
	},
};

/** A hollow dot marks a heading that is shown but not set, such as an inherited angle. */
export const Empty: Story = {
	args: {
		'aria-label': 'Rotation',
		value: null,
		placeholder: 45,
		format: DEGREES,
		getAriaValueText: ( formatted ) => `${ formatted }, inherited`,
	},
};

export const Disabled: Story = {
	args: { ...Default.args, disabled: true },
};

/**
 * The number field keeps the value. The dial points to the same heading and
 * wraps it onto one turn, so 450 points where 90 does.
 */
export const WithNumberInput: Story = {
	args: { format: DEGREES },
	render: function GradientAngle( { onValueChange, name, ...args } ) {
		const [ angle, setAngle ] = useState( 135 );
		const [ draft, setDraft ] = useState< string >();
		return (
			<Stack direction="row" gap="sm" align="flex-end">
				<InputControl
					label="Gradient angle"
					name={ name }
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

/**
 * An unset rotation shows the inherited angle as the field's placeholder and
 * as a hollow dot on the dial, which reads “45 degrees, inherited”. Clearing
 * the field restores it. Entering zero sets an explicit 0°.
 */
export const WithInheritedValue: Story = {
	args: { min: -720, max: 720, format: DEGREES },
	render: function Rotation( { onValueChange, name, ...args } ) {
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
						type="number"
						suffix={ <InputLayout.Slot>°</InputLayout.Slot> }
						min={ args.min }
						max={ args.max }
						step={ args.step }
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
	{ value: 'deg', label: 'deg', unitsPerTurn: 360, step: 1 },
	{ value: 'grad', label: 'grad', unitsPerTurn: 400, step: 1 },
	{ value: 'rad', label: 'rad', unitsPerTurn: 2 * Math.PI, step: 0.01 },
	{ value: 'turn', label: 'turn', unitsPerTurn: 1, step: 0.01 },
];

/**
 * `unitsPerTurn` sets how many units make a full turn, so the dial needs no
 * unit of its own. A quarter turn clockwise reads 90 in degrees, 100 in
 * gradians, 1.57 in radians, and 0.25 in turns.
 */
export const WithUnits: Story = {
	parameters: { controls: { disable: true } },
	render: function RotationWithUnits() {
		const [ unit, setUnit ] = useState( UNITS[ 0 ] );
		// Keep the rotation in turns, so changing the unit never rounds it.
		const [ turns, setTurns ] = useState( 0.25 );
		const [ draft, setDraft ] = useState< string >();
		const rotation = Number( ( turns * unit.unitsPerTurn ).toFixed( 2 ) );
		// Two turns either way, rounded down to a whole number of steps so that
		// zero stays selectable.
		const limit = Number(
			(
				Math.floor( ( 2 * unit.unitsPerTurn ) / unit.step ) * unit.step
			).toFixed( 2 )
		);
		return (
			<Stack direction="row" gap="sm" align="flex-end">
				<InputControl
					label="Rotation"
					type="number"
					step={ unit.step }
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
					min={ -limit }
					max={ limit }
					step={ unit.step }
					unitsPerTurn={ unit.unitsPerTurn }
					getAriaValueText={ ( formatted ) =>
						`${ formatted } ${ unit.label }`
					}
					value={ rotation }
					onValueChange={ ( next ) =>
						setTurns( next / unit.unitsPerTurn )
					}
				/>
			</Stack>
		);
	},
};
