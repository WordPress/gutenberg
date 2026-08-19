import { Fragment, useId } from '@wordpress/element';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { wordpress } from '@wordpress/icons';
import {
	displayShortcut,
	shortcutAriaLabel,
	ariaKeyShortcut,
} from '@wordpress/keycodes';
import { Button } from '../index';
import * as Tooltip from '../../tooltip';
import { VisuallyHidden } from '../../visually-hidden';

const meta: Meta< typeof Button > = {
	title: 'Design System/Components/Button',
	component: Button,
	subcomponents: {
		'Button.Icon': Button.Icon,
	},
	argTypes: {
		'aria-pressed': {
			control: { type: 'boolean' },
		},
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of style consistency with `@wordpress/components` and text overflow behavior. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Button >;

export const Default: Story = {
	args: {
		children: 'Button',
	},
};

export const Outline: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'outline',
	},
};

export const Minimal: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'minimal',
	},
};

export const Compact: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'compact',
	},
};

export const Small: Story = {
	...Default,
	args: {
		...Default.args,
		size: 'small',
	},
};

export const Neutral: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
	},
};

export const NeutralOutline: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'outline',
	},
};

export const Unstyled: Story = {
	...Default,
	args: {
		...Default.args,
		variant: 'unstyled',
	},
};

export const AllTonesAndVariants: Story = {
	...Default,
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
								<Button
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
								<Button
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

export const WithIcon: Story = {
	...Default,
	args: {
		...Default.args,
		children: [ <Button.Icon icon={ wordpress } key="icon" />, 'Button' ],
	},
};

export const Loading: Story = {
	...Default,
	args: {
		...Default.args,
		loading: true,
		loadingAnnouncement: 'Saving data',
	},
};

/**
 * The pressed state is only available for buttons with `tone="neutral"` and
 * `variant="minimal"` and can be toggled via the `aria-pressed` HTML attribute.
 */
export const Pressed: Story = {
	...Default,
	args: {
		...Default.args,
		tone: 'neutral',
		variant: 'minimal',
		'aria-pressed': true,
	},
};

/**
 * `Button` has no dedicated `shortcut` prop, so keyboard shortcuts must be
 * composed manually: a visual hint in the tooltip, `aria-keyshortcuts` for
 * assistive technology, and a visually hidden description. Consumers remain
 * responsible for registering the shortcut and handling the corresponding
 * keyboard event.
 */
export const WithKeyboardShortcut: Story = {
	args: {
		children: 'Save',
		'aria-keyshortcuts': ariaKeyShortcut.primary( 's' ),
	},
	render: ( {
		children,
		'aria-describedby': consumerDescribedBy,
		...args
	} ) => {
		const descriptionId = useId();

		return (
			<Tooltip.Root>
				<Tooltip.Trigger
					render={ <Button { ...args } /> }
					aria-describedby={ [ consumerDescribedBy, descriptionId ]
						.filter( Boolean )
						.join( ' ' ) }
				>
					{ children }
					<VisuallyHidden
						id={ descriptionId }
						aria-hidden="true"
						render={ <span /> }
					>
						Keyboard shortcut: { shortcutAriaLabel.primary( 's' ) }
					</VisuallyHidden>
				</Tooltip.Trigger>
				<Tooltip.Popup>
					{ children }{ ' ' }
					<span aria-hidden="true" dir="ltr">
						{ displayShortcut.primary( 's' ) }
					</span>
				</Tooltip.Popup>
			</Tooltip.Root>
		);
	},
};
