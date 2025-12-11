import { type Meta, type StoryObj } from '@storybook/react';
import '@wordpress/theme/design-tokens.css';
import { Text } from '../text';

const meta: Meta< typeof Text > = {
	title: 'Design System/Components/Text',
	component: Text,
	tags: [ 'status-experimental' ],
};
export default meta;

type Story = StoryObj< typeof Text >;

export const Default: Story = {
	args: {
		children: 'The quick brown fox jumps over the lazy dog',
		fontFamily: 'body',
		fontSize: 'md',
		fontWeight: 'regular',
		lineHeight: 'md',
	},
};

export const Heading: Story = {
	args: {
		children: 'Heading Text',
		fontFamily: 'heading',
		fontSize: 'xl',
		fontWeight: 'medium',
		lineHeight: 'lg',
	},
};

export const Body: Story = {
	args: {
		children: 'Body text with regular weight and medium size.',
		fontFamily: 'body',
		fontSize: 'md',
		fontWeight: 'regular',
		lineHeight: 'md',
	},
};

export const Monospace: Story = {
	args: {
		children: 'const code = "monospace";',
		fontFamily: 'mono',
		fontSize: 'sm',
		fontWeight: 'regular',
		lineHeight: 'sm',
	},
};
