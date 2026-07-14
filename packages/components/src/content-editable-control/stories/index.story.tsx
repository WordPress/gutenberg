/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ContentEditableControl from '..';

const meta: Meta< typeof ContentEditableControl > = {
	id: 'components-contenteditablecontrol',
	title: 'Components/Selection & Input/Common/ContentEditableControl',
	component: ContentEditableControl,
	tags: [ 'status-private' ],
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
		},
	},
};
export default meta;

type Story = StoryObj< typeof ContentEditableControl >;

export const Default: Story = {
	args: {
		label: 'Title',
		placeholder: 'Add a title…',
	},
};
