import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from '../index';
import { Stack } from '../../stack';
import { Text } from '../../text';

const meta: Meta< typeof ProgressBar > = {
	title: 'Components/@wordpress-ui/ProgressBar',
	id: 'design-system-components-progress-bar',
	component: ProgressBar,
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
	args: {
		'aria-label': 'Uploading files',
	},
};
export default meta;

type Story = StoryObj< typeof ProgressBar >;

export const Default: Story = {};

export const Determinate: Story = {
	args: { value: 60 },
};

export const Brand: Story = {
	args: { value: 60, tone: 'brand', size: 'medium' },
};

/**
 * The color prop sets the track background independently of the indicator tone.
 */
export const CustomColor: Story = {
	args: { value: 60, tone: 'brand', size: 'medium', color: '#e9d5ff' },
};

export const CurrentColor: Story = {
	args: { value: 60, tone: 'brand', size: 'medium', color: 'currentColor' },
	render: ( args ) => (
		<Stack style={ { color: '#e9d5ff' } }>
			<ProgressBar { ...args } />
		</Stack>
	),
};

/**
 * Size changes the thickness; tone changes only the filled indicator.
 * Use the toolbar to compare themes, direction, and WordPress global CSS.
 */
export const SizesAndTones: Story = {
	args: { value: 60 },
	render: ( args ) => (
		<Stack direction="column" gap="lg">
			{ ( [ 'neutral', 'brand' ] as const ).map( ( tone ) => (
				<Stack key={ tone } direction="column" gap="md">
					{ ( [ 'small', 'medium', 'large' ] as const ).map(
						( size ) => (
							<Stack key={ size } direction="column" gap="sm">
								<Text>{ `${ tone }, ${ size }` }</Text>
								<ProgressBar
									{ ...args }
									size={ size }
									tone={ tone }
								/>
							</Stack>
						)
					) }
				</Stack>
			) ) }
		</Stack>
	),
};

/**
 * Use `min` and `max` for task-specific units. Provide an accessible name
 * and use `getAriaValueText` when a percentage would be less useful.
 */
export const CustomRange: Story = {
	args: {
		value: 3,
		max: 10,
		'aria-label': 'Uploading images',
		getAriaValueText: ( _, value ) => `${ value } of 10 images uploaded`,
		tone: 'brand',
		size: 'medium',
	},
};
