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
