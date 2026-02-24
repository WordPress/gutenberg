/* eslint-disable jsx-a11y/heading-has-content */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fragment } from '@wordpress/element';
import { Text } from '../index';
import { Stack } from '../../stack';

const meta: Meta< typeof Text > = {
	title: 'Design System/Components/Text',
	component: Text,
};
export default meta;

type Story = StoryObj< typeof Text >;

export const Default: Story = {
	args: {
		variant: 'body-md',
		children: 'The quick brown fox jumps over the lazy dog.',
	},
};

export const Heading2xl: Story = {
	args: {
		variant: 'heading-2xl',
		children: 'Heading 2XL',
	},
};

export const HeadingXl: Story = {
	args: {
		variant: 'heading-xl',
		children: 'Heading XL',
	},
};

export const HeadingLg: Story = {
	args: {
		variant: 'heading-lg',
		children: 'Heading LG',
	},
};

export const HeadingMd: Story = {
	args: {
		variant: 'heading-md',
		children: 'Heading MD',
	},
};

export const HeadingSm: Story = {
	args: {
		variant: 'heading-sm',
		children: 'Heading SM',
	},
};

export const BodyXl: Story = {
	args: {
		variant: 'body-xl',
		children: 'The quick brown fox jumps over the lazy dog.',
	},
};

export const BodyLg: Story = {
	args: {
		variant: 'body-lg',
		children: 'The quick brown fox jumps over the lazy dog.',
	},
};

export const BodyMd: Story = {
	args: {
		variant: 'body-md',
		children: 'The quick brown fox jumps over the lazy dog.',
	},
};

export const BodySm: Story = {
	args: {
		variant: 'body-sm',
		children: 'The quick brown fox jumps over the lazy dog.',
	},
};

export const AllVariants: Story = {
	render: () => (
		<Stack
			direction="column"
			gap="lg"
			style={ { color: 'var(--wpds-color-fg-content-neutral)' } }
		>
			{ (
				[
					'heading-2xl',
					'heading-xl',
					'heading-lg',
					'heading-md',
					'heading-sm',
					'body-xl',
					'body-lg',
					'body-md',
					'body-sm',
				] as const
			 ).map( ( variant ) => (
				<Fragment key={ variant }>
					<Stack direction="column" gap="xs">
						<Text variant="heading-sm">{ variant }</Text>
						<Text variant={ variant }>
							The quick brown fox jumps over the lazy dog.
						</Text>
					</Stack>
				</Fragment>
			) ) }
		</Stack>
	),
};

export const WithRenderProp: Story = {
	render: () => (
		<Stack direction="column" gap="md">
			<Text variant="heading-2xl" render={ <h1 /> }>
				Page Title
			</Text>
			<Text variant="heading-xl" render={ <h2 /> }>
				Section Heading
			</Text>
			<Text variant="body-md" render={ <p /> }>
				A paragraph of body text rendered as a semantic paragraph
				element.
			</Text>
		</Stack>
	),
};
/* eslint-enable jsx-a11y/heading-has-content */
