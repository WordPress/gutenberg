import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from '../..';

const meta: Meta< typeof Tooltip.Root > = {
	title: 'Design System/Components/Tooltip',
	component: Tooltip.Root,
	subcomponents: {
		Provider: Tooltip.Provider,
		Trigger: Tooltip.Trigger,
		Popup: Tooltip.Popup,
	},
};
export default meta;

export const Default: StoryObj< typeof Tooltip.Root > = {
	args: {
		children: (
			<>
				<Tooltip.Trigger>Hover me</Tooltip.Trigger>
				<Tooltip.Popup>Tooltip text</Tooltip.Popup>
			</>
		),
	},
};

/**
 * The `disabled` prop prevents the tooltip from showing, and can be used to
 * show the tooltip conditionally without rendering the underlying react
 * component conditionally (which could cause reconciliation issues).
 */
export const Disabled: StoryObj< typeof Tooltip.Root > = {
	...Default,
	args: {
		...Default.args,
		disabled: true,
	},
};

/**
 * Use the `side` prop to control where the tooltip appears relative to the
 * trigger element.
 */
export const Positioning: StoryObj< typeof Tooltip.Root > = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				gap: '2rem',
				padding: '4rem',
				justifyContent: 'center',
			} }
		>
			<Tooltip.Root>
				<Tooltip.Trigger>Top</Tooltip.Trigger>
				<Tooltip.Popup side="top">Tooltip on top</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>Right</Tooltip.Trigger>
				<Tooltip.Popup side="right">Tooltip on right</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>Bottom</Tooltip.Trigger>
				<Tooltip.Popup side="bottom">Tooltip on bottom</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger>Left</Tooltip.Trigger>
				<Tooltip.Popup side="left">Tooltip on left</Tooltip.Popup>
			</Tooltip.Root>
		</div>
	),
};

/**
 * Use `Tooltip.Provider` to control the delay before tooltips appear.
 * This is useful when you have multiple tooltips and want them to share
 * the same delay configuration.
 */
export const WithProvider: StoryObj< typeof Tooltip.Root > = {
	render: () => (
		<Tooltip.Provider delay={ 0 }>
			<div style={ { display: 'flex', gap: '1rem' } }>
				<Tooltip.Root>
					<Tooltip.Trigger>First</Tooltip.Trigger>
					<Tooltip.Popup>First tooltip</Tooltip.Popup>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger>Second</Tooltip.Trigger>
					<Tooltip.Popup>Second tooltip</Tooltip.Popup>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	),
};
