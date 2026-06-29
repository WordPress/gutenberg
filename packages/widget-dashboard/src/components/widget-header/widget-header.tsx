/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Card, Icon, Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import styles from './widget-header.module.css';

export interface WidgetHeaderProps {
	/** Widget type, source of the icon and title shown as identity. */
	widgetType?: WidgetType;

	/** Id linking the title to the tile's labelled region. */
	titleId?: string;

	/** Render the icon + title cluster on the leading edge. */
	showIdentity?: boolean;

	/** Float over the tile instead of sitting in the card flow. */
	overlay?: boolean;

	/** Toolbar placed on the trailing edge. */
	children?: ReactNode;
}

/**
 * Shared tile header row: an identity cluster (icon + title) on the leading edge
 * and a toolbar on the trailing edge, on one aligned row. Mounted twice per tile
 * so both modes line up. The `base` sits in the card flow and carries the
 * identity; the `overlay` floats the active mode's toolbar in the grid slot
 * (outside the card's edit-mode `inert`) on the same box, so the toolbar lands
 * where the identity row expects it. The overlay is click-through except for the
 * toolbar, so it never covers the body's actionable surface in full-bleed.
 *
 * @param {WidgetHeaderProps} props Component props.
 */
export function WidgetHeader( {
	widgetType,
	titleId,
	showIdentity = false,
	overlay = false,
	children,
}: WidgetHeaderProps ): React.ReactNode {
	return (
		<Card.Header
			className={ clsx( styles.widgetHeader, overlay && styles.overlay ) }
		>
			{ showIdentity && widgetType?.title && (
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
					className={ styles.identity }
				>
					{ widgetType.icon && (
						<span className={ styles.icon } aria-hidden="true">
							<Icon icon={ widgetType.icon } />
						</span>
					) }

					<Card.Title id={ titleId } render={ <h2 /> }>
						{ widgetType.title }
					</Card.Title>
				</Stack>
			) }
			{ children && <div className={ styles.toolbar }>{ children }</div> }
		</Card.Header>
	);
}
