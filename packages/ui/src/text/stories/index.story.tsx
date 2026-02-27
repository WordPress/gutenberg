/* eslint-disable jsx-a11y/heading-has-content */
import type { Meta, StoryObj } from '@storybook/react-vite';
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
				<Stack key={ variant } direction="column" gap="xs">
					<Text variant="heading-sm">{ variant }</Text>
					<Text variant={ variant }>
						The quick brown fox jumps over the lazy dog.
					</Text>
				</Stack>
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
