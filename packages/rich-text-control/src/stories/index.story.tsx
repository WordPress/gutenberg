/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { useState } from '@wordpress/element';
// Registers the core format types (bold, italic, link, …) as a side effect so
// the control's keyboard shortcuts (⌘B / ⌘I / ⌘K) and the inline link popover
// can be exercised here in isolation from the editor.
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import RichTextControl from '../control';

// The control's own styles (and the format/link UI styles) are lazy-loaded in
// Storybook via `storybook/package-styles/config.js`, keyed off this story's
// component id, rather than imported here.

const meta: Meta< typeof RichTextControl > = {
	title: 'RichTextControl',
	component: RichTextControl,
	argTypes: {
		value: { control: false },
		onChange: { action: 'onChange' },
		label: { control: { type: 'text' } },
		placeholder: { control: { type: 'text' } },
		hideLabelFromVision: { control: { type: 'boolean' } },
		disableFormats: { control: { type: 'boolean' } },
		disableLineBreaks: { control: { type: 'boolean' } },
		focusOnMount: { control: { type: 'boolean' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: {
			description: {
				component:
					'A standalone rich text form control for use outside the block canvas (DataForms, sidebar inputs, …). Focus the field, then use ⌘B / ⌘I to format or ⌘K to insert a link. Formatting depends on registered format types — this story imports `@wordpress/format-library` to register the core formats, and wraps the control in a `SlotFillProvider` so format popovers render into the control’s dedicated popover slot.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof RichTextControl >;

function ControlledRichText( {
	value: initialValue,
	onChange,
	...args
}: {
	value?: string;
	onChange?: ( value: string ) => void;
	[ key: string ]: unknown;
} ) {
	const [ value, setValue ] = useState( initialValue ?? '' );
	return (
		<SlotFillProvider>
			<RichTextControl
				{ ...args }
				value={ value }
				onChange={ ( newValue: string ) => {
					setValue( newValue );
					onChange?.( newValue );
				} }
			/>
		</SlotFillProvider>
	);
}

export const Default: Story = {
	render: ( args ) => <ControlledRichText { ...args } />,
	args: {
		label: 'Title',
		placeholder: 'Write a title…',
	},
};

export const WithInitialValue: Story = {
	render: ( args ) => <ControlledRichText { ...args } />,
	args: {
		label: 'Excerpt',
		value: 'The quick <strong>brown</strong> fox jumps over the <a href="https://wordpress.org">lazy dog</a>.',
	},
};
