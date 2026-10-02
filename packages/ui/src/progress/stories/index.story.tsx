import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Progress from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

type StoryArgs = React.ComponentProps< typeof Progress.Root > &
	Pick< React.ComponentProps< typeof Progress.Indicator >, 'color' >;

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
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended.',
		},
	},
	args: { value: 60 },
	render: ( { color, ...args } ) => (
		<Progress.Root { ...args }>
			<Stack justify="space-between" gap="sm">
				<Progress.Label>Uploading files</Progress.Label>
				<Progress.Value />
			</Stack>
			<Progress.Track>
				<Progress.Indicator color={ color } />
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
	render: ( { color, ...args } ) => (
		<Progress.Root { ...args }>
			<Progress.Track>
				<Progress.Indicator color={ color } />
			</Progress.Track>
		</Progress.Root>
	),
};

/** The color prop changes the indicator, leaving the other parts unchanged. */
export const CustomColor: Story = {
	args: { color: '#e85d04' },
};

export const CurrentColor: Story = {
	args: { color: 'currentColor' },
	decorators: [
		( Story ) => (
			<Stack direction="column" gap="sm" style={ { color: '#7f32c9' } }>
				<Text>The indicator inherits this text color.</Text>
				<Story />
			</Stack>
		),
	],
};

/** Use the same task-specific units for visible and accessible value text. */
export const CustomValueFormat: Story = {
	args: {
		value: 3,
		max: 10,
		format: { style: 'decimal' },
		getAriaValueText: ( formattedValue ) =>
			`${ formattedValue } of 10 images uploaded`,
	},
	render: ( { color, ...args } ) => (
		<Progress.Root { ...args }>
			<Progress.Label>Uploading images</Progress.Label>
			<Progress.Track>
				<Progress.Indicator color={ color } />
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
