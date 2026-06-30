import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '../index';

const meta: Meta< typeof Skeleton > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Skeleton',
	component: Skeleton,
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
		},
	},
	argTypes: {
		radius: {
			control: 'select',
			options: [ 'none', 'xs', 'sm', 'md', 'lg', 'xl', 'full' ],
		},
		animation: {
			control: 'inline-radio',
			options: [ 'pulse', 'none' ],
		},
	},
};
export default meta;

type Story = StoryObj< typeof Skeleton >;

export const Default: Story = {
	args: {
		width: 240,
		height: 16,
		radius: 'md',
		animation: 'pulse',
	},
};

export const Circle: Story = {
	...Default,
	args: {
		width: 48,
		height: 48,
		radius: 'full',
	},
};

export const TextLines: Story = {
	render: ( args ) => (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
			} }
		>
			<Skeleton { ...args } width="100%" height={ 16 } />
			<Skeleton { ...args } width="100%" height={ 16 } />
			<Skeleton { ...args } width="60%" height={ 16 } />
		</div>
	),
	args: {
		radius: 'md',
		animation: 'pulse',
	},
};

export const CardPlaceholder: Story = {
	render: ( args ) => (
		<div
			style={ {
				display: 'flex',
				gap: '1rem',
				alignItems: 'center',
				maxWidth: 320,
			} }
		>
			<Skeleton { ...args } width={ 48 } height={ 48 } radius="full" />
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: '0.5rem',
					flex: 1,
				} }
			>
				<Skeleton { ...args } width="80%" height={ 16 } />
				<Skeleton { ...args } width="50%" height={ 16 } />
			</div>
		</div>
	),
	args: {
		animation: 'pulse',
	},
};
