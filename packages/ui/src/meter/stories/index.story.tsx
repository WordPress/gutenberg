import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Meter from '../index';
import { Stack } from '../../stack';

type StoryArgs = React.ComponentProps< typeof Meter.Root > &
	Pick< React.ComponentProps< typeof Meter.Indicator >, 'tone' >;

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
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'API and design may change.',
		},
	},
	argTypes: {
		tone: {
			control: 'select',
			options: [ 'neutral', 'brand', 'success', 'warning', 'error' ],
		},
	},
	args: { value: 24, tone: 'neutral' },
	render: ( { tone, ...args } ) => (
		<Meter.Root { ...args }>
			<Stack justify="space-between" gap="sm">
				<Meter.Label>Storage used</Meter.Label>
				<Meter.Value />
			</Stack>
			<Meter.Track>
				<Meter.Indicator tone={ tone } />
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
	render: ( { tone, ...args } ) => (
		<Meter.Root { ...args }>
			<Meter.Track>
				<Meter.Indicator tone={ tone } />
			</Meter.Track>
		</Meter.Root>
	),
};

export const Brand: Story = { args: { tone: 'brand' } };

/** Use the same measurement-specific units for visible and accessible value text. */
export const CustomValueFormat: Story = {
	args: {
		value: 3,
		max: 10,
		format: { style: 'decimal' },
		getAriaValueText: ( formattedValue ) =>
			`${ formattedValue } of 10 GB used`,
		tone: 'brand',
	},
	render: ( { tone, ...args } ) => (
		<Meter.Root { ...args }>
			<Meter.Label>Storage used</Meter.Label>
			<Meter.Track>
				<Meter.Indicator tone={ tone } />
			</Meter.Track>
			<Meter.Value>
				{ ( formattedValue ) => `${ formattedValue } of 10 GB used` }
			</Meter.Value>
		</Meter.Root>
	),
};

/** Choose the tone and status text together, based on the measurement's meaning. */
export const SemanticTones: Story = {
	parameters: { controls: { disable: true } },
	render: () => (
		<Stack direction="column" gap="lg">
			{ (
				[
					{
						tone: 'success',
						label: 'Password strength',
						value: 85,
						status: 'Strong',
					},
					{
						tone: 'warning',
						label: 'Storage used',
						value: 85,
						status: 'Almost full',
					},
					{
						tone: 'error',
						label: 'Storage used',
						value: 100,
						status: 'Full',
					},
				] as const
			 ).map( ( { tone, label, value, status } ) => (
				<Meter.Root
					key={ tone }
					value={ value }
					getAriaValueText={ ( formattedValue ) =>
						`${ formattedValue }. ${ status }`
					}
				>
					<Stack justify="space-between" gap="sm">
						<Meter.Label>{ label }</Meter.Label>
						<Meter.Value>
							{ ( formattedValue ) =>
								`${ formattedValue } · ${ status }`
							}
						</Meter.Value>
					</Stack>
					<Meter.Track>
						<Meter.Indicator tone={ tone } />
					</Meter.Track>
				</Meter.Root>
			) ) }
		</Stack>
	),
};
