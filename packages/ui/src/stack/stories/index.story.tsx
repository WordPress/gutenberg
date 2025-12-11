import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '../index';
import { Box } from '../../box';

const meta: Meta< typeof Stack > = {
	title: 'Design System/Components/Stack',
	component: Stack,
	tags: [ 'status-experimental' ],
};
export default meta;

const DemoBox = ( { variant }: { variant?: 'lg' } ) => (
	<Box
		backgroundColor="brand"
		style={ {
			width: variant === 'lg' ? '150px' : '100px',
			height: variant === 'lg' ? '150px' : '100px',
		} }
	/>
);

type Story = StoryObj< typeof Stack >;

export const Default: Story = {
	args: {
		gap: 'sm',
		children: (
			<>
				<DemoBox />
				<DemoBox variant="lg" />
				<DemoBox />
				<DemoBox />
				<DemoBox variant="lg" />
				<DemoBox />
			</>
		),
	},
	argTypes: {
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
				<DemoBox variant="lg" />
				<Stack gap="md">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="lg" />
				<Stack direction="column">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="lg" />
			</>
		),
	},
};
