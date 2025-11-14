/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Stack } from '../index';
import { Box } from '../../box';

const meta: Meta< typeof Stack > = {
	title: 'Design System/Components/Stack',
	component: Stack,
	tags: [ 'status-experimental' ],
};
export default meta;

const DemoBox = ( { variant }: { variant?: 'large' } ) => (
	<Box
		backgroundColor="brand"
		padding="sm"
		style={ {
			width: variant === 'large' ? '150px' : '100px',
			height: variant === 'large' ? '150px' : '100px',
		} }
	/>
);

type Story = StoryObj< typeof Stack >;

export const Default: Story = {
	args: {
		gap: 'small',
		children: (
			<>
				<DemoBox />
				<DemoBox variant="large" />
				<DemoBox />
				<DemoBox />
				<DemoBox variant="large" />
				<DemoBox />
			</>
		),
	},
	argTypes: {
		gap: {
			control: {
				type: 'select',
			},
			options: [ 0, 1, 2, 3, 4, 'x-small', 'small', 'medium', 'large' ],
			table: {
				type: {
					summary:
						'number | "x-small" | "small" | "medium" | "large"',
				},
			},
		},
		align: {
			options: [
				'center',
				'end',
				'flex-end',
				'flex-start',
				'start',
				'baseline',
				'stretch',
			],
			table: {
				type: {
					summary:
						'"center" | "end" | "flex-end" | "flex-start" | "start" | "baseline" | "stretch"',
				},
			},
		},
		justify: {
			options: [
				'space-around',
				'space-between',
				'space-evenly',
				'stretch',
				'center',
				'end',
				'flex-end',
				'flex-start',
				'start',
				'left',
				'right',
			],
			table: {
				type: {
					summary:
						'"space-around" | "space-between" | "space-evenly" | "stretch" | "center" | "end" | "flex-end" | "flex-start" | "start"',
				},
			},
		},
		wrap: {
			options: [ 'wrap' ],
			table: {
				type: { summary: '"wrap"' },
			},
		},
	},
};

export const Nested: Story = {
	...Default,
	args: {
		...Default.args,
		align: 'center',
		justify: 'center',
		children: (
			<>
				<DemoBox variant="large" />
				<Stack gap="medium">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="large" />
				<Stack gap={ 0 } direction="column">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="large" />
			</>
		),
	},
};
