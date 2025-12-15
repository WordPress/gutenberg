import { type Meta, type StoryObj } from '@storybook/react';
import '@wordpress/theme/design-tokens.css';
import { Text } from '../text';
import { Stack } from '../../stack';

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

export const WithColor: Story = {
	args: {
		children: 'Text with error color',
		color: 'error',
		fontFamily: 'body',
		fontSize: 'md',
		fontWeight: 'regular',
		lineHeight: 'md',
	},
};

export const ColorVariations: Story = {
	render: () => (
		<Stack direction="column" gap="xs">
			<Text color="neutral">neutral</Text>
			<Text color="neutral-weak">neutral-weak</Text>
			<Text color="neutral-active">neutral-active</Text>
			<Text color="neutral-disabled">neutral-disabled</Text>
			<Text color="neutral-strong">neutral-strong</Text>
			<Text color="neutral-strong-active">neutral-strong-active</Text>
			<Text color="neutral-strong-disabled">neutral-strong-disabled</Text>
			<Text color="neutral-weak-disabled">neutral-weak-disabled</Text>
			<Text color="brand">brand</Text>
			<Text color="brand-active">brand-active</Text>
			<Text color="brand-disabled">brand-disabled</Text>
			<Text color="brand-strong">brand-strong</Text>
			<Text color="brand-strong-active">brand-strong-active</Text>
			<Text color="brand-strong-disabled">brand-strong-disabled</Text>
			<Text color="success">success</Text>
			<Text color="success-weak">success-weak</Text>
			<Text color="info">info</Text>
			<Text color="info-weak">info-weak</Text>
			<Text color="warning">warning</Text>
			<Text color="warning-weak">warning-weak</Text>
			<Text color="caution">caution</Text>
			<Text color="caution-weak">caution-weak</Text>
			<Text color="error">error</Text>
			<Text color="error-weak">error-weak</Text>
			<Text color="error-active">error-active</Text>
			<Text color="error-disabled">error-disabled</Text>
			<Text color="error-strong">error-strong</Text>
			<Text color="error-strong-active">error-strong-active</Text>
			<Text color="error-strong-disabled">error-strong-disabled</Text>
		</Stack>
	),
};
