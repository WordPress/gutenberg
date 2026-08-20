import type { Meta, StoryObj } from '@storybook/react-vite';
import { wordpress } from '@wordpress/icons';
import { Icon } from '../index';

const meta: Meta< typeof Icon > = {
	title: 'Design System/Components/Icon',
	component: Icon,
	tags: [ 'manifest' ],
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <Icon { ...args } />,
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
