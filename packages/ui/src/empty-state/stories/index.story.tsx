import type { Meta, StoryObj } from '@storybook/react-vite';
import { search } from '@wordpress/icons';
import { Button, EmptyState } from '../..';

const meta: Meta< typeof EmptyState.Root > = {
	title: 'Design System/Components/EmptyState',
	component: EmptyState.Root,
	subcomponents: {
		'EmptyState.Visual': EmptyState.Visual,
		'EmptyState.Icon': EmptyState.Icon,
		'EmptyState.Title': EmptyState.Title,
		'EmptyState.Description': EmptyState.Description,
		'EmptyState.Actions': EmptyState.Actions,
	},
};
export default meta;

type Story = StoryObj< typeof EmptyState.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<EmptyState.Icon icon={ search } />
				<EmptyState.Title>No results found</EmptyState.Title>
				<EmptyState.Description>
					Try adjusting your search or filter to find what you&apos;re
					looking for.
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button variant="outline">Clear filters</Button>
					<Button>Add item</Button>
				</EmptyState.Actions>
			</>
		),
	},
};

export const WithCustomVisual: Story = {
	args: {
		children: (
			<>
				<EmptyState.Visual>
					<svg
						width="50"
						height="50"
						viewBox="0 0 50 50"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="25" cy="25" r="25" fill="currentColor" />
					</svg>
				</EmptyState.Visual>
				<EmptyState.Title>All caught up!</EmptyState.Title>
				<EmptyState.Description>
					You&apos;ve completed all your tasks. Great work!
				</EmptyState.Description>
				<EmptyState.Actions>
					<Button>Create new task</Button>
				</EmptyState.Actions>
			</>
		),
	},
};
