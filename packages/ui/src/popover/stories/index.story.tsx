import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Popover } from '../..';

const meta: Meta< typeof Popover.Root > = {
	title: 'Design System/Components/Popover',
	component: Popover.Root,
	subcomponents: {
		'Popover.Trigger': Popover.Trigger,
		'Popover.Popup': Popover.Popup,
		'Popover.Arrow': Popover.Arrow,
		'Popover.Title': Popover.Title,
		'Popover.Description': Popover.Description,
		'Popover.Close': Popover.Close,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Popover is an accessible popup anchored to a trigger button. ' +
					'It can contain interactive content and form controls.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof Popover.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Notifications</Popover.Title>
					<Popover.Description>
						You are all caught up. Good job!
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Use the `side` and `align` props on `Popover.Popup` to control where the
 * popover appears relative to the trigger element.
 */
export const Positioning: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				gap: '2rem',
				padding: '4rem',
				justifyContent: 'center',
			} }
		>
			<Popover.Root>
				<Popover.Trigger>Top</Popover.Trigger>
				<Popover.Popup side="top">
					<Popover.Arrow />
					<Popover.Description>Popover on top</Popover.Description>
				</Popover.Popup>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>Right</Popover.Trigger>
				<Popover.Popup side="right">
					<Popover.Arrow />
					<Popover.Description>Popover on right</Popover.Description>
				</Popover.Popup>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>Bottom</Popover.Trigger>
				<Popover.Popup side="bottom">
					<Popover.Arrow />
					<Popover.Description>Popover on bottom</Popover.Description>
				</Popover.Popup>
			</Popover.Root>

			<Popover.Root>
				<Popover.Trigger>Left</Popover.Trigger>
				<Popover.Popup side="left">
					<Popover.Arrow />
					<Popover.Description>Popover on left</Popover.Description>
				</Popover.Popup>
			</Popover.Root>
		</div>
	),
};

/**
 * A popover with a close button, title, and description. The `Popover.Close`
 * component renders a button that closes the popover when clicked.
 */
export const WithCloseButton: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Settings</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<div
						style={ {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 8,
						} }
					>
						<Popover.Title style={ { margin: 0 } }>
							Settings
						</Popover.Title>
						<Popover.Close
							style={ {
								all: 'unset',
								cursor: 'pointer',
								lineHeight: 1,
							} }
						>
							&#x2715;
						</Popover.Close>
					</div>
					<Popover.Description>
						Configure your notification preferences and display
						settings.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Use the `open` and `onOpenChange` props on `Popover.Root` to control the
 * popover's visibility programmatically.
 */
export const Controlled: Story = {
	render: function Render() {
		const [ isOpen, setIsOpen ] = useState( false );

		return (
			<div style={ { display: 'flex', gap: '1rem' } }>
				<Popover.Root open={ isOpen } onOpenChange={ setIsOpen }>
					<Popover.Trigger>Toggle Popover</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<Popover.Title>Controlled Popover</Popover.Title>
						<Popover.Description>
							This popover is controlled by external state.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
				<button onClick={ () => setIsOpen( ( prev ) => ! prev ) }>
					External toggle (open: { String( isOpen ) })
				</button>
			</div>
		);
	},
};

/**
 * Set `modal` to `true` to trap focus inside the popover when it is open.
 * This is useful for complex popover content that requires user interaction.
 */
export const Modal: Story = {
	args: {
		modal: true,
		children: (
			<>
				<Popover.Trigger>Open Modal Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Modal Popover</Popover.Title>
					<Popover.Description>
						Focus is trapped inside this popover. Press Escape to
						close.
					</Popover.Description>
					<Popover.Close
						style={ {
							all: 'unset',
							cursor: 'pointer',
							marginTop: 8,
							display: 'inline-block',
						} }
					>
						Close
					</Popover.Close>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * The `--wp-ui-popover-z-index` CSS variable controls the z-index of the
 * popover positioner. It can be overridden globally or scoped to a
 * specific container.
 */
export const WithCustomZIndex: Story = {
	...Default,
	name: 'With Custom z-index',
};
