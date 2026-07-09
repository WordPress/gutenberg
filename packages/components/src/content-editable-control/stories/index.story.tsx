/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import ContentEditableControl from '..';

const meta: Meta< typeof ContentEditableControl > = {
	id: 'components-contenteditablecontrol',
	title: 'Components/Selection & Input/Common/ContentEditableControl',
	component: ContentEditableControl,
	args: {
		onSelectedChange: fn(),
	},
	argTypes: {
		children: { control: false },
		isSelected: { control: false },
	},
	tags: [ 'status-private' ],
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'A presentational rich text form control for use outside the block canvas (DataForms, sidebar inputs, …). The component is deliberately presentational: the rich-text behavior (value, formatting, keyboard shortcuts) is injected by the consumer through the forwarded ref and `children`, which mount only while the field has an active selection. See the DataViews `richtext` dataform control for the full `@wordpress/rich-text` assembly.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof ContentEditableControl >;

export const Default: Story = {
	args: {
		label: 'Title',
	},
};

/**
 * `children` — in real usage the consumer's format assembly (`FormatEdit` and
 * its context providers) — mount only while the field is selected. Focus the
 * field to see the placeholder assembly appear.
 */
export const WithChildren: Story = {
	args: {
		label: 'Excerpt',
		children: (
			<p role="status">
				The field is selected, so the format assembly is mounted.
			</p>
		),
	},
};
