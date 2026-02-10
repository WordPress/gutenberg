import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import type { ComponentProps } from 'react';
import * as Dialog from '../index';

const meta: Meta< typeof Dialog.Root > = {
	title: 'Design System/Components/Dialog',
	component: Dialog.Root,
	subcomponents: {
		'Dialog.Trigger': Dialog.Trigger,
		'Dialog.Popup': Dialog.Popup,
		'Dialog.Header': Dialog.Header,
		'Dialog.Title': Dialog.Title,
		'Dialog.CloseIcon': Dialog.CloseIcon,
		'Dialog.Action': Dialog.Action,
		'Dialog.Footer': Dialog.Footer,
	},
	argTypes: {
		modal: {
			control: 'inline-radio',
			options: [ true, false, 'trap-focus' ],
			table: {
				defaultValue: { summary: 'true' },
				type: {
					summary: 'boolean | "trap-focus"',
				},
			},
		},
	},
	parameters: {
		docs: {
			description: {
				component: `
Dialog is a popup that opens on top of the entire page. Every dialog must include a \`Dialog.Title\` component for accessibility — it serves as both the visible heading and the accessible label for the dialog.

When using the Dialog component, make sure to always include a visible close button, either \`Dialog.CloseIcon\` or a clear dismissing action button. If your dialog has a "Cancel" button in the footer, the close icon may be redundant and create confusion about what clicking "X" means.

Use \`Dialog.CloseIcon\` for informational dialogs where dismissing is safe and expected. For dialogs requiring explicit user choice (especially destructive actions), omit the close icon and rely on footer action buttons like "Cancel" and "Confirm" instead.
				`,
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof Dialog.Root >;

/**
 * An informational dialog with a close icon, where there is no ambiguity on
 * what happens when clicking the close icon.
 */
export const _Default: Story = {
	args: {
		children: (
			<>
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Header>
						<Dialog.Title>Welcome</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					<p>
						This dialog demonstrates best practices for
						informational dialogs. It includes a close icon because
						dismissing it is safe and expected.
					</p>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};

/**
 * A confirmation dialog that intentionally omits the close icon. The user
 * must explicitly choose "Cancel" or "Confirm" to make their intent clear,
 * since it is not obvious what would happen when clicking a close icon.
 */
export const ConfirmDialog: Story = {
	args: {
		children: (
			<>
				<Dialog.Trigger>Confirm Action</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Header>
						<Dialog.Title>Confirm Action</Dialog.Title>
					</Dialog.Header>
					<p>
						Are you sure you want to proceed? This action cannot be
						undone.
					</p>
					<Dialog.Footer>
						<Dialog.Action variant="outline">Cancel</Dialog.Action>
						<Dialog.Action>Confirm</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};

const ALL_SIZES = [ 'small', 'medium', 'large', 'stretch', 'full' ] as const;

function SizeSelector( {
	value,
	onChange,
}: {
	value: ComponentProps< typeof Dialog.Popup >[ 'size' ];
	onChange: ( size: ComponentProps< typeof Dialog.Popup >[ 'size' ] ) => void;
} ) {
	const selectId = useId();
	return (
		<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
			<label htmlFor={ selectId }>Dialog size preset</label>
			<select
				id={ selectId }
				value={ value }
				onChange={ ( e ) =>
					onChange(
						e.target.value as ComponentProps<
							typeof Dialog.Popup
						>[ 'size' ]
					)
				}
			>
				{ ALL_SIZES.map( ( s ) => (
					<option key={ s } value={ s }>
						{ s }
						{ s === 'medium' ? ' (default)' : '' }
					</option>
				) ) }
			</select>
		</div>
	);
}

function SizePlaygroundContent() {
	const [ size, setSize ] =
		useState< ComponentProps< typeof Dialog.Popup >[ 'size' ] >( 'medium' );
	return (
		<>
			<div
				style={ {
					display: 'flex',
					flexDirection: 'column',
					gap: 16,
					alignItems: 'start',
				} }
			>
				<SizeSelector value={ size } onChange={ setSize } />
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
			</div>
			<Dialog.Popup size={ size }>
				<Dialog.Header>
					<Dialog.Title>Size Playground</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<SizeSelector value={ size } onChange={ setSize } />
				<p>
					Use the dropdown above (or outside the dialog) to change the
					popup size. Both controls stay in sync.
				</p>
				<Dialog.Footer>
					<Dialog.Action>Got it</Dialog.Action>
				</Dialog.Footer>
			</Dialog.Popup>
		</>
	);
}

export const AllSizes: Story = {
	args: {
		children: <SizePlaygroundContent />,
	},
};
