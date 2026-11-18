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

/**
 * Use an infotip sparingly when a status needs a short explanation.
 * The whole badge opens the popup on hover or activation.
 */
export const WithInfotip: Story = {
	args: {
		children: 'Special requirements',
		intent: 'informational',
		infotip: {
			popover: Popover,
			popup: (
				<Popover.Popup
					style={ {
						maxWidth:
							'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
					} }
				>
					<VisuallyHidden render={ <Popover.Title /> }>
						Special requirements
					</VisuallyHidden>
					<Popover.Description>
						This domain requires a local address in the country
						where it is registered.
					</Popover.Description>
				</Popover.Popup>
			),
		},
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
		infotip: {
			popover: Popover,
			popup: (
				<Popover.Popup
					style={ {
						maxWidth:
							'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
					} }
				>
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
		infotip: {
			popover: Popover,
			popup: (
				<Popover.Popup
					style={ {
						maxWidth:
							'min(var(--wpds-dimension-surface-width-sm), var(--available-width))',
					} }
				>
					<VisuallyHidden render={ <Popover.Title /> }>
						Upload failed
					</VisuallyHidden>
					<Stack direction="column" gap="sm">
						<Popover.Description>
							The upload was interrupted. Check your connection
							and try again.
						</Popover.Description>
						<Stack direction="row" justify="flex-end">
							<Button
								variant="minimal"
								tone="neutral"
								size="compact"
								onClick={ action( 'Retry upload' ) }
							>
								Retry upload
							</Button>
						</Stack>
					</Stack>
				</Popover.Popup>
			),
		},
	},
};

export const AllIntents: Story = {
	args: {
		...WithInfotip.args,
		children: 'Status',
	},
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
					<Badge
						{ ...args }
						intent={ intent }
						infotip={ undefined }
					/>
					<Badge { ...args } intent={ intent } />
				</Fragment>
			) ) }
		</div>
	),
};
