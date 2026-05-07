import type { Meta, StoryObj } from '@storybook/react-vite';
import { wordpress } from '@wordpress/icons';
import { Icon } from '../index';

const meta: Meta< typeof Icon > = {
	title: 'Design System/Components/Icon',
	component: Icon,
	decorators: [
		( Story ) => {
			return (
				<div
					style={ {
						color: 'var( --wpds-color-fg-content-neutral )',
					} }
				>
					<Story />
				</div>
			);
		},
	],
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending a general readiness review. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Icon >;

export const Default: Story = {
	args: {
		icon: wordpress,
	},
};

/**
 * Explicit `fill` colors in the icon will be preserved.
 */
export const WithIntrinsicFillColor: Story = {
	args: {
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="blue"
			>
				<rect x="0" y="0" width="24" height="24" />
			</svg>
		),
	},
};
