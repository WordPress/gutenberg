import type { Meta, StoryObj } from '@storybook/react-vite';
import * as Menu from '../..';

const meta: Meta< typeof Menu.Root > = {
	title: 'Design System/Components/Menu',
	component: Menu.Root,
};

export default meta;

type Story = StoryObj< typeof Menu.Root >;

export const NonModalWithIframe: Story = {
	render: () => (
		<>
			<Menu.Root modal={ false }>
				<Menu.Trigger>Open menu</Menu.Trigger>
				<Menu.Popup>
					<Menu.Item>
						<Menu.ItemLabel>First action</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>Second action</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
			<button type="button">Parent target</button>
			<iframe
				title="Editor canvas one"
				srcDoc="<button type='button'>Canvas target one</button>"
			/>
			<iframe
				title="Editor canvas two"
				srcDoc="<button type='button'>Canvas target two</button>"
			/>
		</>
	),
};
