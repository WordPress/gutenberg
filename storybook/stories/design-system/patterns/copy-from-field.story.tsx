import type { Meta, StoryObj } from '@storybook/react-vite';
import { CopyFromFieldExample } from './copy-from-field';

const meta = {
	title: 'Design System/Patterns/Copy from Field',
	component: CopyFromFieldExample,
	parameters: {
		controls: { disable: true },
	},
	tags: [ 'docs-only' ],
} satisfies Meta< typeof CopyFromFieldExample >;

export default meta;

type Story = StoryObj< typeof meta >;

export const CopyFromField: Story = {
	name: 'Copy from a text field',
	render: () => (
		<div style={ { maxWidth: '24rem' } }>
			<CopyFromFieldExample />
		</div>
	),
};
