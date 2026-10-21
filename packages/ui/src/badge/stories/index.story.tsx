import type { Meta, StoryObj } from '@storybook/react-vite';
import { action } from 'storybook/actions';
import { Fragment } from '@wordpress/element';
import { Badge } from '../index';
import * as Popover from '../../popover';
import { VisuallyHidden } from '../../visually-hidden';
import { Link } from '../../link';
import { Button } from '../../button';
import { Stack } from '../../stack';

const meta: Meta< typeof Badge > = {
	tags: [ 'manifest' ],
	title: 'Components/@wordpress-ui/Badge',
	id: 'design-system-components-badge',
	component: Badge,
	parameters: {
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Badge >;

export const Default: Story = {
	args: {
		children: 'Badge',
	},
};

export const High: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'high',
	},
};

export const Medium: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'medium',
	},
};

export const Low: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'low',
	},
};

export const Stable: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'stable',
	},
};

export const Informational: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'informational',
	},
};

export const Draft: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'draft',
	},
};

export const None: Story = {
	...Default,
	args: {
		...Default.args,
		intent: 'none',
	},
};

export const AllIntents: Story = {
	...Default,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'max-content min-content',
				gap: '1rem',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			{ (
				[
					'high',
					'medium',
					'low',
					'stable',
					'informational',
					'draft',
					'none',
				] as const
			 ).map( ( intent ) => (
				<Fragment key={ intent }>
					<div
						style={ {
							paddingInlineEnd: '1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						{ intent }
					</div>
					<div
						style={ {
							padding: '0.5rem 1rem',
							display: 'flex',
							alignItems: 'center',
						} }
					>
						<Badge { ...args } intent={ intent } />
					</div>
				</Fragment>
			) ) }
		</div>
	),
};

/**
 * Use an infotip sparingly when a status needs a short explanation.
 * The whole badge opens the popup on hover or activation.
 */
export const WithInfotip: Story = {
	args: {
		children: 'Special requirements',
		intent: 'informational',
		infotip: (
			<Popover.Popup
				style={ {
					maxWidth:
						'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
				} }
			>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>
					Special requirements
				</VisuallyHidden>
				<Popover.Description>
					This domain requires a local address in the country where it
					is registered.
				</Popover.Description>
			</Popover.Popup>
		),
	},
};

/**
 * A related link can follow the explanation. Keep important recovery actions
 * available elsewhere in the interface too.
 */
export const InfotipWithLink: Story = {
	args: {
		children: 'HSTS required',
		intent: 'medium',
		infotip: (
			<Popover.Popup
				style={ {
					maxWidth:
						'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
				} }
			>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>
					HSTS required
				</VisuallyHidden>
				<Popover.Description>
					This domain requires HTTPS for every connection.{ ' ' }
					<Link href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security">
						Learn about HSTS
					</Link>
				</Popover.Description>
			</Popover.Popup>
		),
	},
};

/**
 * Prefer at most one related action. Use a detail view or dialog for longer
 * workflows, and make essential recovery actions available outside the infotip.
 */
export const InfotipWithButton: Story = {
	args: {
		children: 'Failed',
		intent: 'high',
		infotip: (
			<Popover.Popup
				style={ {
					maxWidth:
						'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
				} }
			>
				<Popover.Arrow />
				<VisuallyHidden render={ <Popover.Title /> }>
					Payout failed
				</VisuallyHidden>
				<Stack direction="column" gap="sm">
					<Popover.Description>
						The account number is too long. The money is back in
						your balance and will be included in your next payout.
					</Popover.Description>
					<Button
						variant="outline"
						size="small"
						onClick={ action( 'Update bank account' ) }
					>
						Update bank account
					</Button>
				</Stack>
			</Popover.Popup>
		),
	},
};

export const AllIntentsWithInfotips: Story = {
	args: WithInfotip.args,
	render: ( args ) => (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(3, max-content)',
				justifyItems: 'start',
				gap: 'var(--wpds-dimension-gap-lg)',
				alignItems: 'center',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			<strong>Intent</strong>
			<strong>Static</strong>
			<strong>With infotip</strong>
			{ (
				[
					'high',
					'medium',
					'low',
					'stable',
					'informational',
					'draft',
					'none',
				] as const
			 ).map( ( intent ) => (
				<Fragment key={ intent }>
					<span>{ intent }</span>
					<Badge intent={ intent }>Status</Badge>
					<Badge { ...args } intent={ intent }>
						Status
					</Badge>
				</Fragment>
			) ) }
		</div>
	),
};
