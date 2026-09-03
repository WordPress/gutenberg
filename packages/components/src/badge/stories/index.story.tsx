import type { Meta, StoryObj } from '@storybook/react-vite';
import Badge from '..';

/**
 * This component is deprecated. Please use `Badge` from the `@wordpress/ui`
 * package instead.
 */
const meta: Meta< typeof Badge > = {
	component: Badge,
	title: 'Components/Deprecated/Badge',
	id: 'components-badge',
	tags: [ 'status-private' ],
	parameters: {
		componentStatus: {
			status: 'not-recommended',
			whereUsed: 'global',
			notes: 'Deprecated. Use [`Badge`](?path=/docs/design-system-components-badge--docs) from `@wordpress/ui` instead.',
		},
	},
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
