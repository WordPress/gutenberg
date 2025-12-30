import type { Meta, StoryObj } from '@storybook/react';
import { useState } from '@wordpress/element';
import '@wordpress/theme/design-tokens.css';
import * as Slider from '../index';
import * as Field from '../../field';

const meta: Meta< typeof Slider.Root > = {
	title: 'Design System/Components/Form/Primitives/Slider',
	component: Slider.Root,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Control: Slider.Control,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Track: Slider.Track,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Indicator: Slider.Indicator,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Thumb: Slider.Thumb,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Value: Slider.Value,
	},
};
export default meta;

type Story = StoryObj< typeof Slider.Root >;

/**
 * A basic slider with a single thumb.
 */
export const Default: Story = {
	args: {
		defaultValue: 50,
		min: 0,
		max: 100,
		step: 1,
		children: (
			<>
				<Slider.Value />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};

/**
 * A controlled slider with external state management.
 */
export const Controlled: Story = {
	render: () => {
		const ControlledSlider = () => {
			const [ value, setValue ] = useState< number >( 50 );

			return (
				<>
					<Slider.Root
						value={ value }
						onValueChange={ ( newValue ) =>
							setValue( newValue as number )
						}
					>
						<Slider.Value />
						<Slider.Control>
							<Slider.Track>
								<Slider.Indicator />
								<Slider.Thumb />
							</Slider.Track>
						</Slider.Control>
					</Slider.Root>
					<div>
						<button onClick={ () => setValue( 0 ) }>
							Set to 0
						</button>
						<button onClick={ () => setValue( 50 ) }>
							Set to 50
						</button>
						<button onClick={ () => setValue( 100 ) }>
							Set to 100
						</button>
					</div>
				</>
			);
		};

		return <ControlledSlider />;
	},
};

/**
 * A range slider with two thumbs for selecting a range of values.
 */
export const RangeSlider: Story = {
	args: {
		defaultValue: [ 25, 75 ],
		min: 0,
		max: 100,
		step: 1,
		children: (
			<>
				<Slider.Value>
					{ ( formattedValues: readonly string[] ) =>
						formattedValues.join( ' – ' )
					}
				</Slider.Value>
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb index={ 0 } />
						<Slider.Thumb index={ 1 } />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};

/**
 * A slider with custom step values.
 */
export const WithSteps: Story = {
	args: {
		defaultValue: 50,
		min: 0,
		max: 100,
		step: 10,
		largeStep: 25,
		children: (
			<>
				<Slider.Value />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};

/**
 * A disabled slider.
 */
export const Disabled: Story = {
	args: {
		defaultValue: 50,
		disabled: true,
		children: (
			<>
				<Slider.Value />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};

/**
 * A vertical slider.
 */
export const Vertical: Story = {
	args: {
		defaultValue: 50,
		orientation: 'vertical',
		children: (
			<>
				<Slider.Value />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};

/**
 * A slider wrapped in a Field component for accessible labeling.
 * This is the recommended pattern for form controls.
 */
export const WithField: Story = {
	render: () => (
		<Field.Root name="volume">
			<Field.Label>Volume</Field.Label>
			<Field.Control
				render={
					<Slider.Root defaultValue={ 50 }>
						<Slider.Value />
						<Slider.Control>
							<Slider.Track>
								<Slider.Indicator />
								<Slider.Thumb />
							</Slider.Track>
						</Slider.Control>
					</Slider.Root>
				}
			/>
			<Field.Description>Adjust the volume level.</Field.Description>
		</Field.Root>
	),
};

/**
 * A slider with custom value formatting using Intl.NumberFormat options.
 */
export const CustomFormat: Story = {
	args: {
		defaultValue: 50,
		min: 0,
		max: 100,
		format: {
			style: 'percent',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		},
		children: (
			<>
				<Slider.Value />
				<Slider.Control>
					<Slider.Track>
						<Slider.Indicator />
						<Slider.Thumb />
					</Slider.Track>
				</Slider.Control>
			</>
		),
	},
};
