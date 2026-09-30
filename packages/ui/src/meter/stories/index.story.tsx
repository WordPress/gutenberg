import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Meter from '../index';
import { Stack } from '../../stack';
import * as Progress from '../../progress';

type StoryArgs = React.ComponentProps< typeof Meter.Root > &
	Pick< React.ComponentProps< typeof Meter.Indicator >, 'tone' | 'color' >;

const meta: Meta< StoryArgs > = {
	title: 'Components/@wordpress-ui/Meter',
	id: 'design-system-components-meter',
	component: Meter.Root,
	subcomponents: {
		'Meter.Track': Meter.Track,
		'Meter.Indicator': Meter.Indicator,
		'Meter.Label': Meter.Label,
		'Meter.Value': Meter.Value,
	},
	argTypes: {
		color: { control: 'text' },
		value: { control: 'number' },
		tone: { control: 'select', options: [ 'neutral', 'brand' ] },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'New component, pending design review.',
		},
	},
	args: { value: 24, tone: 'neutral' },
	render: ( { tone, color, ...args } ) => (
		<Meter.Root { ...args }>
			<Stack justify="space-between" gap="sm">
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Value />
			</Stack>
			<Meter.Track>
				<Meter.Indicator tone={ tone } color={ color } />
			</Meter.Track>
		</Meter.Root>
	),
};
export default meta;

type Story = StoryObj< StoryArgs >;

export const Default: Story = {};

/** A visible label is optional when the quantity has an accessible name. */
export const BarOnly: Story = {
	args: { 'aria-label': 'Storage used' },
	render: ( { tone, color, ...args } ) => (
		<Meter.Root { ...args }>
			<Meter.Track>
				<Meter.Indicator tone={ tone } color={ color } />
			</Meter.Track>
		</Meter.Root>
	),
};

export const Brand: Story = { args: { tone: 'brand' } };

/** The color prop overrides the indicator tone, leaving the other parts unchanged. */
export const CustomColor: Story = {
	args: { tone: 'brand', color: '#8b2fc9' },
};

export const CurrentColor: Story = {
	args: { tone: 'brand', color: 'currentColor' },
	decorators: [
		( Story ) => (
			<div style={ { color: '#8b2fc9' } }>
				<Story />
			</div>
		),
	],
};

/** Compare tones in light, dark, RTL, and WordPress global CSS modes. */
export const Tones: Story = {
	render: ( { tone: _tone, color, ...args } ) => (
		<Stack direction="column" gap="lg">
			{ ( [ 'neutral', 'brand' ] as const ).map( ( tone ) => (
				<Meter.Root key={ tone } { ...args }>
					<Stack justify="space-between" gap="sm">
						<Meter.Label>{ tone }</Meter.Label>
						<Meter.Value />
					</Stack>
					<Meter.Track>
						<Meter.Indicator tone={ tone } color={ color } />
					</Meter.Track>
				</Meter.Root>
			) ) }
		</Stack>
	),
};

/** Use the same measurement-specific units for visible and accessible value text. */
export const CustomRange: Story = {
	args: {
		value: 3,
		max: 10,
		format: { style: 'decimal' },
		getAriaValueText: ( formattedValue ) =>
			`${ formattedValue } of 10 GB used`,
		tone: 'brand',
	},
	render: ( { tone, color, ...args } ) => (
		<Meter.Root { ...args }>
			<Meter.Label>Storage used</Meter.Label>
			<Meter.Track>
				<Meter.Indicator tone={ tone } color={ color } />
			</Meter.Track>
			<Meter.Value>
				{ ( formattedValue ) => `${ formattedValue } of 10 GB used` }
			</Meter.Value>
		</Meter.Root>
	),
};

/** Meter and Progress share their colors, with different track heights. */
export const ComparedWithProgress: Story = {
	render: ( { tone, color, ...args } ) => (
		<Stack direction="column" gap="lg">
			<Meter.Root { ...args }>
				<Stack justify="space-between" gap="sm">
					<Meter.Label>Storage used</Meter.Label>
					<Meter.Value />
				</Stack>
				<Meter.Track>
					<Meter.Indicator tone={ tone } color={ color } />
				</Meter.Track>
			</Meter.Root>
			<Progress.Root
				value={ args.value }
				min={ args.min }
				max={ args.max }
				format={ args.format }
				locale={ args.locale }
			>
				<Stack justify="space-between" gap="sm">
					<Progress.Label>Exporting data</Progress.Label>
					<Progress.Value />
				</Stack>
				<Progress.Track>
					<Progress.Indicator tone={ tone } color={ color } />
				</Progress.Track>
			</Progress.Root>
		</Stack>
	),
};
