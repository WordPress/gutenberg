import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import type { ComponentProps } from 'react';
import { VisuallyHidden } from '../../visually-hidden';
import * as Dialog from '../index';

const meta: Meta< typeof Dialog.Root > = {
	title: 'Design System/Components/Dialog',
	component: Dialog.Root,
	subcomponents: {
		'Dialog.Trigger': Dialog.Trigger,
		'Dialog.Popup': Dialog.Popup,
		'Dialog.Header': Dialog.Header,
		'Dialog.Title': Dialog.Title,
		'Dialog.Description': Dialog.Description,
		'Dialog.CloseIcon': Dialog.CloseIcon,
		'Dialog.Action': Dialog.Action,
		'Dialog.Footer': Dialog.Footer,
	},
	argTypes: {
		modal: {
			control: 'inline-radio',
			options: [ true, false, 'trap-focus' ],
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
					<Dialog.Description>
						This dialog demonstrates best practices for
						informational dialogs. It includes a close icon because
						dismissing it is safe and expected.
					</Dialog.Description>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
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

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where a dialog renders below another popover when you
 * want it above.
 *
 * The `--wp-ui-dialog-z-index` CSS variable controls the z-index of the
 * dialog's backdrop and popup. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   dialog in the page), or
 * - **Per instance**, by passing a `Dialog.Portal` with a `style` (or
 *   `className`) to `Dialog.Popup`'s `portal` prop. The variable cascades
 *   from the portal wrapper to everything rendered inside it.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		children: (
			<>
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
				<Dialog.Popup
					portal={
						<Dialog.Portal
							style={ { '--wp-ui-dialog-z-index': '9999' } }
						/>
					}
				>
					<Dialog.Header>
						<Dialog.Title>Custom z-index</Dialog.Title>
						<Dialog.CloseIcon />
					</Dialog.Header>
					<Dialog.Description>
						The backdrop and popup render at `z-index: 9999` via the
						`--wp-ui-dialog-z-index` CSS custom property, set on
						`Dialog.Portal` through the `portal` prop.
					</Dialog.Description>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};

/**
 * A dialog with a visually hidden title. The title is still present in the
 * DOM for `aria-labelledby`, but is not visible to sighted users.
 *
 * Use `<VisuallyHidden render={ <Dialog.Title /> }>` so that `Dialog.Title`
 * keeps its `<h2>` element while being visually hidden.
 */
export const WithVisuallyHiddenTitle: Story = {
	args: {
		children: (
			<>
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
				<Dialog.Popup>
					<Dialog.Header>
						<VisuallyHidden render={ <Dialog.Title /> }>
							Accessible dialog heading
						</VisuallyHidden>
						<Dialog.CloseIcon />
					</Dialog.Header>
					<p>
						This dialog has a visually hidden title. Inspect the DOM
						or use a screen reader to verify the heading is present.
					</p>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};
