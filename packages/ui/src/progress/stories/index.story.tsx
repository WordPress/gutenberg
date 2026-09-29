import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Progress from '../index';
import { Stack } from '../../stack';

type StoryArgs = React.ComponentProps< typeof Progress.Root > &
	Pick< React.ComponentProps< typeof Progress.Track >, 'size' > &
	Pick< React.ComponentProps< typeof Progress.Indicator >, 'tone' | 'color' >;

const meta: Meta< StoryArgs > = {
	title: 'Components/@wordpress-ui/Progress',
	id: 'design-system-components-progress',
	component: Progress.Root,
	subcomponents: {
		'Progress.Track': Progress.Track,
		'Progress.Indicator': Progress.Indicator,
		'Progress.Label': Progress.Label,
		'Progress.Value': Progress.Value,
	},
	argTypes: {
		color: { control: 'text' },
		value: { control: { type: 'number', min: 0, max: 100 } },
		size: { control: 'select', options: [ 'small', 'medium', 'large' ] },
		tone: { control: 'select', options: [ 'neutral', 'brand' ] },
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'New component, pending design review. The existing ProgressBar in @wordpress/components remains supported.',
		},
	},
	args: { value: 60, size: 'small', tone: 'neutral' },
	render: ( { size, tone, color, ...args } ) => (
		<Progress.Root { ...args }>
			<Stack justify="space-between" gap="sm">
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value />
			</Stack>
			<Progress.Track size={ size }>
				<Progress.Indicator tone={ tone } color={ color } />
			</Progress.Track>
		</Progress.Root>
	),
};
export default meta;

type Story = StoryObj< StoryArgs >;

export const Default: Story = {};

/** Pass null when the amount of completed work is unknown. */
export const Indeterminate: Story = { args: { value: null } };

/** A visible label is optional when the task has an accessible name. */
export const BarOnly: Story = {
	args: { 'aria-label': 'Uploading files' },
	render: ( { size, tone, color, ...args } ) => (
		<Progress.Root { ...args }>
			<Progress.Track size={ size }>
				<Progress.Indicator tone={ tone } color={ color } />
			</Progress.Track>
		</Progress.Root>
	),
};

export const Brand: Story = { args: { tone: 'brand', size: 'medium' } };

/** The color prop overrides the indicator tone, leaving the other parts unchanged. */
export const CustomColor: Story = {
	args: { tone: 'brand', size: 'medium', color: '#8b2fc9' },
};

export const CurrentColor: Story = {
	args: { tone: 'brand', size: 'medium', color: 'currentColor' },
	decorators: [
		( Story ) => (
			<div style={ { color: '#8b2fc9' } }>
				<Story />
			</div>
		),
	],
};

/** Compare sizes and tones in light, dark, RTL, and WordPress global CSS modes. */
export const SizesAndTones: Story = {
	render: ( { size: _size, tone: _tone, color, ...args } ) => (
		<Stack direction="column" gap="lg">
			{ ( [ 'neutral', 'brand' ] as const ).map( ( tone ) => (
				<Stack key={ tone } direction="column" gap="md">
					{ ( [ 'small', 'medium', 'large' ] as const ).map(
						( size ) => (
							<Progress.Root key={ size } { ...args }>
								<Stack justify="space-between" gap="sm">
									<Progress.Label>{ `${ tone }, ${ size }` }</Progress.Label>
									<Progress.Value />
								</Stack>
								<Progress.Track size={ size }>
									<Progress.Indicator
										tone={ tone }
										color={ color }
									/>
								</Progress.Track>
							</Progress.Root>
						)
					) }
				</Stack>
			) ) }
		</Stack>
	),
};

/** Use the same task-specific units for visible and accessible value text. */
export const CustomRange: Story = {
	args: {
		value: 3,
		max: 10,
		format: { style: 'decimal' },
		getAriaValueText: ( formattedValue ) =>
			`${ formattedValue } of 10 images uploaded`,
		tone: 'brand',
		size: 'medium',
	},
	render: ( { size, tone, color, ...args } ) => (
		<Progress.Root { ...args }>
			<Progress.Label>Uploading images</Progress.Label>
			<Progress.Track size={ size }>
				<Progress.Indicator tone={ tone } color={ color } />
			</Progress.Track>
			<Progress.Value>
				{ ( formattedValue, value ) =>
					value === null
						? 'Preparing images'
						: `${ formattedValue } of 10 images uploaded`
				}
			</Progress.Value>
		</Progress.Root>
	),
};
