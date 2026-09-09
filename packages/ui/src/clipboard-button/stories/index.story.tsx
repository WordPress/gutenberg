import { Fragment } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { code } from '@wordpress/icons';
import {
	displayShortcut,
	ariaKeyShortcut,
	shortcutAriaLabel,
} from '@wordpress/keycodes';
import { ClipboardButton } from '../index';
import * as Tooltip from '../../tooltip';

const meta: Meta< typeof ClipboardButton > = {
	title: 'Design System/Components/ClipboardButton',
	component: ClipboardButton,
	subcomponents: {
		'ClipboardButton.Icon': ClipboardButton.Icon,
		'ClipboardButton.Label': ClipboardButton.Label,
	},
	argTypes: {
		'aria-pressed': {
			control: { type: 'boolean' },
		},
	},
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

/**
 * With no children, `ClipboardButton` renders `ClipboardButton.Icon` and uses
 * the copy label as its accessible name. `tone` and `variant` default to
 * `Button`'s values (`brand` and `solid`).
 */
export const Default: Story = {};

export const Outline: Story = {
	args: {
		variant: 'outline',
	},
};

export const Minimal: Story = {
	args: {
		variant: 'minimal',
	},
};

export const Neutral: Story = {
	args: {
		tone: 'neutral',
	},
};

export const NeutralOutline: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const AllTonesAndVariants: Story = {
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content repeat(2, max-content)',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			<div></div>
			<div style={ { textAlign: 'center' } }>Resting</div>
			<div style={ { textAlign: 'center' } }>Disabled</div>
			{ ( [ 'brand', 'neutral' ] as const ).map( ( tone ) => (
				<Fragment key={ tone }>
					{ (
						[ 'solid', 'outline', 'minimal', 'unstyled' ] as const
					 ).map( ( variant ) => (
						<Fragment key={ variant }>
							<div
								style={ {
									paddingInlineEnd: '1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								{ variant }, { tone }
							</div>
							<div
								style={ {
									padding: '0.5rem 1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								<ClipboardButton
									{ ...args }
									tone={ tone }
									variant={ variant }
								/>
							</div>
							<div
								style={ {
									padding: '0.5rem 1rem',
									display: 'flex',
									alignItems: 'center',
								} }
							>
								<ClipboardButton
									{ ...args }
									tone={ tone }
									variant={ variant }
									disabled
								/>
							</div>
						</Fragment>
					) ) }
				</Fragment>
			) ) }
		</div>
	),
};

/**
 * Render only a text label, without `ClipboardButton.Icon`. The label
 * switches to “Copied” after a successful copy. When the button already
 * shows a visible label, set `hasTooltip={ false }` to hide the redundant
 * tooltip.
 */
export const TextOnly: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
		hasTooltip: false,
		children: <ClipboardButton.Label />,
	},
};

/**
 * Compose `ClipboardButton.Icon` with `ClipboardButton.Label`, the same way
 * `Button.Icon` is used inside `Button`. When the button already shows a
 * visible label, set `hasTooltip={ false }` to hide the redundant tooltip.
 */
export const WithIconAndText: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
		hasTooltip: false,
		children: [
			<ClipboardButton.Icon key="icon" />,
			<ClipboardButton.Label key="label" />,
		],
	},
};

/**
 * Place the icon after the label. When the button already shows a visible
 * label, set `hasTooltip={ false }` to hide the redundant tooltip.
 */
export const IconAtEnd: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
		hasTooltip: false,
		children: [
			<ClipboardButton.Label key="label" />,
			<ClipboardButton.Icon key="icon" />,
		],
	},
};

/**
 * Pass a custom `icon` to `ClipboardButton.Icon` for the pending state.
 * A check icon still appears after a successful copy. When the button already
 * shows a visible label, set `hasTooltip={ false }` to hide the redundant
 * tooltip.
 */
export const CustomIcon: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
		hasTooltip: false,
		text: "console.log( 'Code is Poetry' );",
		children: [
			<ClipboardButton.Icon key="icon" icon={ code } />,
			<ClipboardButton.Label key="label" pending="Copy code" />,
		],
	},
};

/**
 * Pass custom `pending` and `success` text to `ClipboardButton.Label`. When
 * the button already shows a visible label, set `hasTooltip={ false }` to
 * hide the redundant tooltip.
 */
export const WithCustomLabel: Story = {
	args: {
		tone: 'neutral',
		variant: 'outline',
		hasTooltip: false,
		children: [
			<ClipboardButton.Icon key="icon" />,
			<ClipboardButton.Label
				key="label"
				pending="Copy permalink"
				success="Permalink copied"
			/>,
		],
	},
};

/**
 * Customize the tooltip labels shown before and after copying.
 */
export const CustomLabels: Story = {
	args: {
		tone: 'neutral',
		variant: 'minimal',
		tooltipInitialText: 'Copy permalink',
		tooltipSuccessText: 'Permalink copied',
	},
};

const EXAMPLE_SHORTCUT_OBJECT = {
	displayShortcut: displayShortcut.primary( 'c' ),
	ariaKeyShortcut: ariaKeyShortcut.primary( 'c' ),
	label: shortcutAriaLabel.primary( 'c' ),
};

/**
 * Use the `displayShortcut`, `ariaKeyShortcut`, and `shortcutAriaLabel` helpers
 * from `@wordpress/keycodes` to create the visual, ARIA-compatible, and
 * human-readable representations of the shortcut.
 */
export const WithShortcut: Story = {
	args: {
		tone: 'neutral',
		variant: 'minimal',
		shortcut: EXAMPLE_SHORTCUT_OBJECT,
	},
};

/**
 * Customize where the tooltip appears relative to the button by passing a
 * `<Tooltip.Positioner />` element with a `side` to the `positioner` prop.
 */
export const WithCustomPositioner: Story = {
	args: {
		tone: 'neutral',
		variant: 'minimal',
		positioner: <Tooltip.Positioner side="right" />,
	},
};
