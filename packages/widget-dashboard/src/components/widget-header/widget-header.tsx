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
	/**
	 * Widget type, source of the icon and title shown as identity.
	 */
	widgetType?: WidgetType;

	/**
	 * Id linking the title to the tile's labelled region.
	 */
	titleId?: string;

	/**
	 * Render the icon + title cluster on the leading edge.
	 */
	showIdentity?: boolean;

	/**
	 * Float over the tile instead of sitting in the card flow.
	 */
	overlay?: boolean;

	/**
	 * Inert the identity while customizing, so it does not capture interaction.
	 */
	editMode?: boolean;

	/**
	 * Toolbar placed on the trailing edge.
	 */
	children?: ReactNode;
}

/**
 * Tile header row: identity (icon + title) and a toolbar on one line. Rendered
 * in the card flow, or as an `overlay` in the grid slot for full-bleed widgets
 * that have no in-card header.
 *
 * @param {WidgetHeaderProps} props Component props.
 */
export function WidgetHeader( {
	widgetType,
	titleId,
	showIdentity = false,
	overlay = false,
	editMode = false,
	children,
}: WidgetHeaderProps ): React.ReactNode {
	return (
		<Card.Header
			className={ clsx( styles.widgetHeader, overlay && styles.overlay ) }
		>
			{ showIdentity && widgetType?.title && (
				<Stack
					direction="row"
					align="center"
					gap="sm"
					className={ styles.identity }
					{ ...( editMode ? { inert: 'true' } : {} ) }
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
