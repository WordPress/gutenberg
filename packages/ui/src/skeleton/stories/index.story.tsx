import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '../index';

const meta: Meta< typeof Skeleton > = {
	tags: [ 'manifest' ],
	title: 'Design System/Components/Skeleton',
	component: Skeleton,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Skeleton >;

// A single line of body text is 16px tall (--wpds-typography-line-height-xs).
const textLineHeight = 'var(--wpds-typography-line-height-xs)';

export const Default: Story = {
	args: {
		style: {
			width: 'var(--wpds-dimension-surface-width-xs)',
			height: textLineHeight,
			borderRadius: 'var(--wpds-border-radius-md)',
		},
	},
};

export const Circle: Story = {
	args: {
		style: {
			width: 'var(--wpds-dimension-size-lg)',
			height: 'var(--wpds-dimension-size-lg)',
			borderRadius: '50%',
		},
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
			<Skeleton
				{ ...args }
				style={ {
					width: '100%',
					height: textLineHeight,
					borderRadius: 'var(--wpds-border-radius-md)',
				} }
			/>
			<Skeleton
				{ ...args }
				style={ {
					width: '100%',
					height: textLineHeight,
					borderRadius: 'var(--wpds-border-radius-md)',
				} }
			/>
			<Skeleton
				{ ...args }
				style={ {
					width: '60%',
					height: textLineHeight,
					borderRadius: 'var(--wpds-border-radius-md)',
				} }
			/>
		</div>
	),
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
			<Skeleton
				{ ...args }
				style={ {
					width: 'var(--wpds-dimension-size-lg)',
					height: 'var(--wpds-dimension-size-lg)',
					borderRadius: '50%',
				} }
			/>
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: '0.5rem',
					flex: 1,
				} }
			>
				<Skeleton
					{ ...args }
					style={ {
						width: '80%',
						height: textLineHeight,
						borderRadius: 'var(--wpds-border-radius-md)',
					} }
				/>
				<Skeleton
					{ ...args }
					style={ {
						width: '50%',
						height: textLineHeight,
						borderRadius: 'var(--wpds-border-radius-md)',
					} }
				/>
			</div>
		</div>
	),
};
