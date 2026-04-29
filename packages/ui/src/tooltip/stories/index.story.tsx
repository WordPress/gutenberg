import type { Meta, StoryObj } from '@storybook/react-vite';
import { formatBold, formatItalic } from '@wordpress/icons';
import { Icon } from '../../icon';
import * as Tooltip from '../';

const meta: Meta< typeof Tooltip.Root > = {
	title: 'Design System/Components/Tooltip',
	component: Tooltip.Root,
	subcomponents: {
		Provider: Tooltip.Provider,
		Trigger: Tooltip.Trigger,
		Popup: Tooltip.Popup,
		Portal: Tooltip.Portal,
	},
};
export default meta;

export const Default: StoryObj< typeof Tooltip.Root > = {
	args: {
		children: (
			<>
				<Tooltip.Trigger aria-label="Save">💾</Tooltip.Trigger>
				<Tooltip.Popup>Save</Tooltip.Popup>
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
				<Tooltip.Trigger aria-label="Up">⬆️</Tooltip.Trigger>
				<Tooltip.Popup side="top">Up</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger aria-label="Forward">➡️</Tooltip.Trigger>
				<Tooltip.Popup side="right">Forward</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger aria-label="Down">⬇️</Tooltip.Trigger>
				<Tooltip.Popup side="bottom">Down</Tooltip.Popup>
			</Tooltip.Root>

			<Tooltip.Root>
				<Tooltip.Trigger aria-label="Back">⬅️</Tooltip.Trigger>
				<Tooltip.Popup side="left">Back</Tooltip.Popup>
			</Tooltip.Root>
		</div>
	),
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where a tooltip renders below another popover when you
 * want it above.
 *
 * The `--wp-ui-tooltip-z-index` CSS variable controls the z-index of the
 * tooltip's positioner. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   tooltip in the page), or
 * - **Per instance**, by passing a `Tooltip.Portal` with a `style` (or
 *   `className`) to `Tooltip.Popup`'s `portal` prop. The variable cascades
 *   from the portal wrapper to everything rendered inside it.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: StoryObj< typeof Tooltip.Root > = {
	name: 'With Custom z-index',
	args: {
		children: (
			<>
				<Tooltip.Trigger aria-label="Save">💾</Tooltip.Trigger>
				<Tooltip.Popup
					portal={
						<Tooltip.Portal
							style={ { '--wp-ui-tooltip-z-index': '9999' } }
						/>
					}
				>
					Save
				</Tooltip.Popup>
			</>
		),
	},
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
					<Tooltip.Trigger aria-label="Bold">
						<Icon icon={ formatBold } />
					</Tooltip.Trigger>
					<Tooltip.Popup>Bold</Tooltip.Popup>
				</Tooltip.Root>

				<Tooltip.Root>
					<Tooltip.Trigger aria-label="Italic">
						<Icon icon={ formatItalic } />
					</Tooltip.Trigger>
					<Tooltip.Popup>Italic</Tooltip.Popup>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	),
};
