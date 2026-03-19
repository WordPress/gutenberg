import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import * as Collapsible from '../index';

const meta: Meta< typeof Collapsible.Root > = {
	title: 'Design System/Components/Collapsible',
	component: Collapsible.Root,
	subcomponents: {
		'Collapsible.Trigger': Collapsible.Trigger,
		'Collapsible.Panel': Collapsible.Panel,
	},
};
export default meta;

type Story = StoryObj< typeof Collapsible.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Collapsible.Trigger>Toggle</Collapsible.Trigger>
				<Collapsible.Panel>
					<p>Collapsible content here.</p>
				</Collapsible.Panel>
			</>
		),
	},
};

export const DefaultOpen: Story = {
	argTypes: { open: { control: false } },
	args: {
		defaultOpen: true,
		children: (
			<>
				<Collapsible.Trigger>Toggle</Collapsible.Trigger>
				<Collapsible.Panel>
					<p>This panel is open by default.</p>
				</Collapsible.Panel>
			</>
		),
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		children: (
			<>
				<Collapsible.Trigger>Toggle (disabled)</Collapsible.Trigger>
				<Collapsible.Panel>
					<p>This content cannot be toggled.</p>
				</Collapsible.Panel>
			</>
		),
	},
};

/**
 * When `hiddenUntilFound` is set on `Collapsible.Panel`, the collapsed content
 * remains in the DOM using the `hidden="until-found"` HTML attribute instead of
 * being removed entirely. This lets the browser's native page search (Ctrl/Cmd+F)
 * find text inside collapsed panels and automatically expand them to reveal the
 * match — improving discoverability without sacrificing the collapsed layout.
 */
export const HiddenUntilFound: Story = {
	render: function HiddenUntilFound() {
		return (
			<div>
				<p>
					Use the browser&apos;s find-in-page (Ctrl/Cmd+F) to search
					for &quot;hidden treasure&quot;. The collapsed panel will
					automatically expand to reveal the match.
				</p>
				<Collapsible.Root>
					<Collapsible.Trigger>Expand to reveal</Collapsible.Trigger>
					<Collapsible.Panel hiddenUntilFound>
						<p>
							This is the hidden treasure that can be found via
							the browser&apos;s built-in page search even while
							the panel is collapsed.
						</p>
					</Collapsible.Panel>
				</Collapsible.Root>
			</div>
		);
	},
};

export const Controlled: Story = {
	argTypes: {
		open: { control: false },
		defaultOpen: { control: false },
	},
	render: function Controlled() {
		const [ open, setOpen ] = useState( false );
		return (
			<Collapsible.Root open={ open } onOpenChange={ setOpen }>
				<Collapsible.Trigger>
					{ open ? 'Close' : 'Open' }
				</Collapsible.Trigger>
				<Collapsible.Panel>
					<p>Controlled collapsible panel.</p>
				</Collapsible.Panel>
			</Collapsible.Root>
		);
	},
};
