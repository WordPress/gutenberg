import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import type { ComponentProps } from 'react';
import { Stack } from '../../stack';
import { VisuallyHidden } from '../../visually-hidden';
import * as Dialog from '../index';

const meta: Meta< typeof Dialog.Root > = {
	title: 'Design System/Components/Dialog',
	component: Dialog.Root,
	subcomponents: {
		'Dialog.Trigger': Dialog.Trigger,
		'Dialog.Portal': Dialog.Portal,
		'Dialog.Popup': Dialog.Popup,
		'Dialog.Header': Dialog.Header,
		'Dialog.Title': Dialog.Title,
		'Dialog.Description': Dialog.Description,
		'Dialog.Content': Dialog.Content,
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
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
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
					<Dialog.Content>
						<Dialog.Description>
							This dialog demonstrates best practices for
							informational dialogs. It includes a close icon
							because dismissing it is safe and expected.
						</Dialog.Description>
					</Dialog.Content>
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
		<Stack direction="row" gap="sm" align="center">
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
		</Stack>
	);
}

function SizePlaygroundContent() {
	const [ size, setSize ] =
		useState< ComponentProps< typeof Dialog.Popup >[ 'size' ] >( 'medium' );
	return (
		<>
			<Stack direction="column" gap="lg" align="start">
				<SizeSelector value={ size } onChange={ setSize } />
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
			</Stack>
			<Dialog.Popup size={ size }>
				<Dialog.Header>
					<Dialog.Title>Size Playground</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg" align="start">
						<SizeSelector value={ size } onChange={ setSize } />
						<p style={ { margin: 0 } }>
							Use the dropdown above (or outside the dialog) to
							change the popup size. Both controls stay in sync.
						</p>
					</Stack>
				</Dialog.Content>
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
					<Dialog.Content>
						<Dialog.Description>
							The backdrop and popup render at `z-index: 9999` via
							the `--wp-ui-dialog-z-index` CSS custom property,
							set on `Dialog.Portal` through the `portal` prop.
						</Dialog.Description>
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};

function StickyToggle( {
	stickyHeader,
	stickyFooter,
	onStickyHeaderChange,
	onStickyFooterChange,
}: {
	stickyHeader: boolean;
	stickyFooter: boolean;
	onStickyHeaderChange: ( value: boolean ) => void;
	onStickyFooterChange: ( value: boolean ) => void;
} ) {
	const headerId = useId();
	const footerId = useId();
	return (
		<Stack direction="row" gap="md" align="center">
			<Stack direction="row" gap="xs" align="center">
				<input
					id={ headerId }
					type="checkbox"
					checked={ stickyHeader }
					onChange={ ( e ) =>
						onStickyHeaderChange( e.target.checked )
					}
				/>
				<label htmlFor={ headerId }>Sticky header</label>
			</Stack>
			<Stack direction="row" gap="xs" align="center">
				<input
					id={ footerId }
					type="checkbox"
					checked={ stickyFooter }
					onChange={ ( e ) =>
						onStickyFooterChange( e.target.checked )
					}
				/>
				<label htmlFor={ footerId }>Sticky footer</label>
			</Stack>
		</Stack>
	);
}

function ScrollableContent() {
	const [ size, setSize ] =
		useState< ComponentProps< typeof Dialog.Popup >[ 'size' ] >( 'medium' );
	const [ stickyHeader, setStickyHeader ] = useState( true );
	const [ stickyFooter, setStickyFooter ] = useState( true );

	const header = (
		<Dialog.Header>
			<Dialog.Title>Terms of service</Dialog.Title>
			<Dialog.CloseIcon />
		</Dialog.Header>
	);
	const footer = (
		<Dialog.Footer>
			<Dialog.Action variant="outline">Decline</Dialog.Action>
			<Dialog.Action>Accept</Dialog.Action>
		</Dialog.Footer>
	);
	const controls = (
		<Stack direction="column" gap="sm" align="start">
			<SizeSelector value={ size } onChange={ setSize } />
			<StickyToggle
				stickyHeader={ stickyHeader }
				stickyFooter={ stickyFooter }
				onStickyHeaderChange={ setStickyHeader }
				onStickyFooterChange={ setStickyFooter }
			/>
		</Stack>
	);

	return (
		<>
			<Stack direction="column" gap="lg" align="start">
				{ controls }
				<Dialog.Trigger>Open Dialog</Dialog.Trigger>
			</Stack>
			<Dialog.Popup size={ size }>
				{ stickyHeader && header }
				<Dialog.Content>
					{ ! stickyHeader && header }
					<Stack direction="column" gap="lg">
						{ controls }
						{ Array.from( { length: 20 } ).map( ( _, index ) => (
							<p key={ index } style={ { margin: 0 } }>
								Paragraph { index + 1 }: Lorem ipsum dolor sit
								amet, consectetur adipiscing elit. Sed do
								eiusmod tempor incididunt ut labore et dolore
								magna aliqua. Ut enim ad minim veniam, quis
								nostrud exercitation ullamco laboris nisi ut
								aliquip ex ea commodo consequat.
							</p>
						) ) }
					</Stack>
					{ ! stickyFooter && footer }
				</Dialog.Content>
				{ stickyFooter && footer }
			</Dialog.Popup>
		</>
	);
}

/**
 * When dialog content overflows the available height, `Dialog.Content`
 * scrolls while `Dialog.Header` and `Dialog.Footer` stay pinned to the
 * popup's top and bottom edges. Separator lines appear only when there
 * is off-screen content above the header or below the footer.
 *
 * To let the header or footer scroll with the body instead of staying
 * pinned, render it *inside* `Dialog.Content` rather than as a sibling.
 * The inline "Sticky header / Sticky footer" checkboxes toggle exactly
 * that placement at runtime.
 *
 * Use the inline controls to change the popup `size` and the sticky
 * placement. The same controls render both outside and inside the
 * dialog and stay in sync.
 */
export const Scrollable: Story = {
	args: {
		children: <ScrollableContent />,
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
					<Dialog.Content>
						<p style={ { margin: 0 } }>
							This dialog has a visually hidden title. Inspect the
							DOM or use a screen reader to verify the heading is
							present.
						</p>
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action>Got it</Dialog.Action>
					</Dialog.Footer>
				</Dialog.Popup>
			</>
		),
	},
};
