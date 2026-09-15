import type { Meta, StoryObj } from '@storybook/react-vite';
import { wordpress } from '@wordpress/icons';
import { Icon } from '../index';

const meta: Meta< typeof Icon > = {
	title: 'Design System/Components/Icon',
	component: Icon,
	tags: [ 'manifest' ],
	decorators: [
		( Story ) => {
			return (
				<div
					style={ {
						color: 'var( --wpds-color-foreground-content-neutral )',
					} }
				>
					<Story />
				</div>
			);
		},
	],
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'Prefer this component over the `Icon` component from `@wordpress/components` or `@wordpress/icons`.',
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
