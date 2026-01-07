import type { Meta, StoryObj } from '@storybook/react-webpack5';
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
