import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	formatBold,
	formatItalic,
	formatUnderline,
	info,
} from '@wordpress/icons';
import { Icon, IconButton, Popover, Tooltip, VisuallyHidden } from '../..';

const meta: Meta = {
	title: 'Design System/Components/Tooltip/Usage Guidelines',
	parameters: {
		controls: { disable: true },
	},
	tags: [ '!dev' ],
};
export default meta;

type Story = StoryObj;

/**
 * Tooltips work best as visual labels for icon-only controls. Each trigger
 * must have its own accessible name via `aria-label`.
 */
export const RecommendedUsage: Story = {
	render: () => (
		<Tooltip.Provider delay={ 0 }>
			<div style={ { display: 'flex', gap: '0.25rem' } }>
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

				<Tooltip.Root>
					<Tooltip.Trigger aria-label="Underline">
						<Icon icon={ formatUnderline } />
					</Tooltip.Trigger>
					<Tooltip.Popup>Underline</Tooltip.Popup>
				</Tooltip.Root>
			</div>
		</Tooltip.Provider>
	),
};

/**
 * Popups that open when hovering an info icon should use `Popover` with
 * `openOnHover` instead of a Tooltip. This ensures the content is accessible
 * to touch and screen reader users.
 */
export const InfotipWithPopover: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				alignItems: 'center',
				gap: 'var(--wpds-dimension-gap-xs)',
			} }
		>
			<span>Label</span>
			<Popover.Root>
				<Popover.Trigger
					openOnHover
					delay={ 200 }
					closeDelay={ 200 }
					aria-label="More information"
					style={ {
						background: 'none',
						border: 'none',
						padding: 0,
						cursor: 'var(--wpds-cursor-control)',
						display: 'inline-flex',
						alignItems: 'center',
						borderRadius: 'var(--wpds-border-radius-sm)',
					} }
				>
					<Icon icon={ info } size={ 20 } />
				</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<VisuallyHidden render={ <Popover.Title /> }>
						More information
					</VisuallyHidden>
					<Popover.Description>
						This is additional context about the label. Unlike
						tooltips, this content is accessible to touch and screen
						reader users.
					</Popover.Description>
				</Popover.Popup>
			</Popover.Root>
		</div>
	),
};

/**
 * `IconButton` has built-in tooltip support via the `label` prop,
 * making it the easiest way to provide a tooltip for icon-only actions.
 */
export const IconButtonWithTooltip: Story = {
	render: () => (
		<div style={ { display: 'flex', gap: '0.25rem' } }>
			<IconButton icon={ formatBold } label="Bold" size="compact" />
			<IconButton icon={ formatItalic } label="Italic" size="compact" />
			<IconButton
				icon={ formatUnderline }
				label="Underline"
				size="compact"
			/>
		</div>
	),
};
