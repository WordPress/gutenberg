/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-webpack5';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Badge } from '../index';

const meta: Meta< typeof Badge > = {
	title: 'Design System/Components/Badge',
	component: Badge,
	tags: [ 'status-experimental' ],
};
export default meta;

type Story = StoryObj< typeof Badge >;

export const Default: Story = {
	args: {
		children: 'Badge',
	},
};

export const High: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'high',
	},
};

export const Medium: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'medium',
	},
};

export const Low: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'low',
	},
};

export const Stable: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'stable',
	},
};

export const Informational: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'informational',
	},
};

export const Draft: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'draft',
	},
};

export const None: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'none',
	},
};

export const AllIntents: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content min-content',
				gap: '1rem',
				color: 'var(--wpds-color-fg-content-neutral)',
				backgroundColor: 'var(--wpds-color-bg-surface-neutral-strong)',
			} }
		>
			{ (
				[
					'high',
					'medium',
					'low',
					'stable',
					'informational',
					'draft',
					'none',
				] as const
			 ).map( ( intent ) => (
				<Fragment key={ intent }>
					<div
						style={ {
							paddingInlineEnd: '1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						{ intent }
					</div>
					<div
						style={ {
							padding: '0.5rem 1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						<Badge { ...args } intent={ intent } />
					</div>
				</Fragment>
			) ) }
		</div>
	),
};
