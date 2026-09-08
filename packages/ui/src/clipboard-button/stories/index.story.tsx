import type { Meta, StoryObj } from '@storybook/react-vite';
import { cog } from '@wordpress/icons';
import { ClipboardButton } from '../index';
import * as Tooltip from '../../tooltip';

const meta: Meta< typeof ClipboardButton > = {
	title: 'Design System/Components/ClipboardButton',
	component: ClipboardButton,
	args: {
		text: 'Text copied from ClipboardButton',
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components`, text overflow behavior, and overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof ClipboardButton >;

export const Default: Story = {};

export const Outline: Story = {
	args: {
		variant: 'outline',
	},
};

export const Solid: Story = {
	args: {
		variant: 'solid',
		tone: 'brand',
	},
};

export const Small: Story = {
	args: {
		size: 'small',
	},
};

export const Compact: Story = {
	args: {
		size: 'compact',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

/**
 * Pass children to render a labeled button. The clipboard icon is placed at
 * `iconPosition`, which defaults to `start`.
 */
export const WithLabel: Story = {
	args: {
		children: 'Copy',
	},
};

export const IconAtEnd: Story = {
	args: {
		children: 'Copy',
		iconPosition: 'end',
	},
};

export const CustomIcon: Story = {
	args: {
		children: 'Copy',
		icon: cog,
	},
};

/**
 * Customize the tooltip labels shown before and after copying.
 */
export const CustomLabels: Story = {
	args: {
		tooltipInitialText: 'Copy permalink',
		tooltipSuccessText: 'Permalink copied',
	},
};

export const WithoutTooltip: Story = {
	args: {
		hasTooltip: false,
		children: 'Copy',
	},
};

/**
 * Customize where the tooltip appears relative to the button by passing a
 * `<Tooltip.Positioner />` element with a `side` to the `positioner` prop.
 */
export const WithCustomPositioner: Story = {
	args: {
		positioner: <Tooltip.Positioner side="right" />,
	},
};
