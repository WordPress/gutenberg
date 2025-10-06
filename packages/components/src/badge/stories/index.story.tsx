/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies
 */
import Badge from '..';

const meta: Meta< typeof Badge > = {
	component: Badge,
	title: 'Components/Containers/Badge',
	id: 'components-badge',
	tags: [ 'status-private' ],
};

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		children: 'Code is Poetry',
	},
};

export const Info: Story = {
	args: {
		...Default.args,
		intent: 'info',
	},
};

export const Success: Story = {
	args: {
		...Default.args,
		intent: 'success',
	},
};

export const Warning: Story = {
	args: {
		...Default.args,
		intent: 'warning',
	},
};

export const Error: Story = {
	args: {
		...Default.args,
		intent: 'error',
	},
};

export const InsideAnchor: Story = {
	render: ( args ) => (
		<>
			<a
				href="#badge-link"
				style={ { display: 'flex', marginBottom: '16px' } }
			>
				display: flex - View details <Badge { ...args } />
			</a>
			<a
				href="#badge-link"
				style={ { display: 'block', marginBottom: '16px' } }
			>
				display: block - View details <Badge { ...args } />
			</a>
			<a href="#badge-link" style={ { display: 'inline-block' } }>
				display: inline-block - View details <Badge { ...args } />
			</a>
		</>
	),
	args: {
		children: 'New',
		intent: 'info',
	},
};

export const InsideDiv: Story = {
	render: ( args ) => (
		<>
			<div
				style={ {
					textDecoration: 'underline',
					display: 'flex',
					alignItems: 'center',
					marginBottom: '16px',
				} }
			>
				<span>display: flex - Some text</span>
				<Badge { ...args } />
			</div>
			<div
				style={ {
					textDecoration: 'underline',
					display: 'block',
					marginBottom: '16px',
				} }
			>
				<span>display: block - Some text</span>
				<Badge { ...args } />
			</div>
			<div
				style={ {
					textDecoration: 'underline',
					display: 'inline-block',
				} }
			>
				<span>display: inline-block - Some text</span>
				<Badge { ...args } />
			</div>
		</>
	),
	args: {
		intent: 'info',
		children: 'A badge',
	},
};
