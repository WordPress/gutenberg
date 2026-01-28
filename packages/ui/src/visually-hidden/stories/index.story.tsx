import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from '../';

const meta: Meta< typeof VisuallyHidden > = {
	title: 'Design System/Components/VisuallyHidden',
	component: VisuallyHidden,
};
export default meta;

type Story = StoryObj< typeof VisuallyHidden >;

export const Default: Story = {
	render: () => (
		<>
			<VisuallyHidden>This should not show.</VisuallyHidden>
			<div>
				This text will <VisuallyHidden>but not inline </VisuallyHidden>
				always show.
			</div>
		</>
	),
};
