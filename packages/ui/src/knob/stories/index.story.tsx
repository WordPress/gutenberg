import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import { Knob } from '../index';
import { InputControl } from '../../form/input-control';
import { InputLayout } from '../../form/primitives/input-layout';
import * as Select from '../../form/primitives/select';
import { Stack } from '../../stack';
import { VisuallyHidden } from '../../visually-hidden';

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

/** `unit` sets the CSS angle unit for the value, range and steps. */
export const Turns: Story = {
	args: { unit: 'turn', defaultValue: 0.25 },
};

type Unit = NonNullable< React.ComponentProps< typeof Knob >[ 'unit' ] >;

const UNITS: { value: Unit; label: string; fullTurn: number }[] = [
	{ value: 'deg', label: 'deg', fullTurn: 360 },
	{ value: 'turn', label: 'turn', fullTurn: 1 },
	{ value: 'rad', label: 'rad', fullTurn: 2 * Math.PI },
	{ value: 'grad', label: 'grad', fullTurn: 400 },
];

function convertAngle( value: number, from: Unit, to: Unit ) {
	const fromTurn = UNITS.find( ( unit ) => unit.value === from )!.fullTurn;
	const toTurn = UNITS.find( ( unit ) => unit.value === to )!.fullTurn;
	// Keeps the precision of the default step in each unit.
	const decimals = to === 'turn' || to === 'rad' ? 2 : 0;
	return Number( ( ( value / fromTurn ) * toTurn ).toFixed( decimals ) );
}

/**
 * Knob is a dial only. Compose it with `InputControl` to let users type an
 * exact angle, keeping both in sync through a shared value. A unit `Select`
 * in the input's suffix converts the value when the unit changes.
 */
export const WithInputControl: Story = {
	render: function Template( args ) {
		const [ angle, setAngle ] = useState< number | null >( 90 );
		const [ unit, setUnit ] = useState< Unit >( 'deg' );
		const unitLabelId = useId();

		return (
			<Stack direction="row" gap="sm" align="end">
				<InputControl
					label="Angle"
					type="number"
					min={ args.min }
					max={ args.max }
					step="any"
					value={ angle ?? '' }
					onValueChange={ ( nextValue ) =>
						setAngle(
							nextValue === '' ? null : parseFloat( nextValue )
						)
					}
					suffix={
						<InputLayout.Slot padding="minimal">
							<VisuallyHidden id={ unitLabelId }>
								Unit
							</VisuallyHidden>
							<Select.Root
								items={ UNITS }
								value={ unit }
								onValueChange={ ( nextUnit ) => {
									if ( ! nextUnit ) {
										return;
									}
									setAngle(
										( current ) =>
											current &&
											convertAngle(
												current,
												unit,
												nextUnit
											)
									);
									setUnit( nextUnit );
								} }
							>
								<Select.Trigger
									size="small"
									variant="minimal"
									// Overrides the field label, which names the input.
									aria-labelledby={ unitLabelId }
								/>
								<Select.Popup width="content">
									{ UNITS.map( ( item ) => (
										<Select.Item
											key={ item.value }
											value={ item.value }
											size="small"
										>
											<Select.ItemLabel>
												{ item.label }
											</Select.ItemLabel>
										</Select.Item>
									) ) }
								</Select.Popup>
							</Select.Root>
						</InputLayout.Slot>
					}
				/>
				<Knob
					{ ...args }
					unit={ unit }
					value={ angle }
					onValueChange={ setAngle }
				/>
			</Stack>
		);
	},
};
