import { Fragment } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { cog } from '@wordpress/icons';
import { ClipboardButton } from '../index';
import * as Tooltip from '../../tooltip';

const meta: Meta< typeof ClipboardButton > = {
	title: 'Design System/Components/ClipboardButton',
	component: ClipboardButton,
	subcomponents: {
		'ClipboardButton.Icon': ClipboardButton.Icon,
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
 * Render only a text label, without `ClipboardButton.Icon`.
 */
export const TextOnly: Story = {
	args: {
		children: 'Copy',
	},
};

/**
 * Compose `ClipboardButton.Icon` with a visible label, the same way
 * `Button.Icon` is used inside `Button`.
 */
export const WithIconAndText: Story = {
	args: {
		children: [ <ClipboardButton.Icon key="icon" />, 'Copy' ],
	},
};

export const IconAtEnd: Story = {
	args: {
		children: [ 'Copy', <ClipboardButton.Icon key="icon" /> ],
	},
};

/**
 * Pass a custom `icon` to `ClipboardButton.Icon` for the pending state.
 * A check icon still appears after a successful copy.
 */
export const CustomIcon: Story = {
	args: {
		children: [ <ClipboardButton.Icon key="icon" icon={ cog } />, 'Copy' ],
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
