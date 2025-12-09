/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * WordPress dependencies
 */
import '@wordpress/theme/design-tokens.css';

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
		gap: {
			control: {
				type: 'select',
			},
			options: [ 0, 1, 2, 3, 4, '2xs', 'xs', 'sm', 'md', 'lg', 'xl' ],
			table: {
				type: {
					summary:
						'number | "2xs" | "xs" | "sm" | "md" | "lg" | "xl"',
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
				<DemoBox variant="lg" />
				<Stack gap="md">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="lg" />
				<Stack gap={ 0 } direction="column">
					<DemoBox />
					<DemoBox />
				</Stack>
				<DemoBox variant="lg" />
			</>
		),
	},
};
