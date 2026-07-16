/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { Card, Icon, Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetInfotip } from './widget-header-infotip';
import {
	WIDGET_HEADER_IDENTITY_RESERVE,
	WIDGET_TOOLBAR_CHIP_RESERVE,
	WidgetHeaderAvailableSizeProvider,
} from './widget-header-size';
import styles from './widget-header.module.css';

export interface WidgetHeaderProps {
	/**
	 * Widget type, source of the icon, title, and help note shown as
	 * identity.
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
	// Content-box width of the header row, so toolbar controls can compare
	// their natural width against the space the row actually offers.
	const [ headerWidth, setHeaderWidth ] = useState( 0 );
	const headerMeasureRef = useResizeObserver< HTMLDivElement >(
		( [ entry ] ) => setHeaderWidth( entry.contentRect.width )
	);

	const hasIdentity = showIdentity && !! widgetType?.title;
	const availableSize =
		headerWidth > 0
			? headerWidth -
			  WIDGET_TOOLBAR_CHIP_RESERVE -
			  ( hasIdentity ? WIDGET_HEADER_IDENTITY_RESERVE : 0 )
			: null;

	return (
		<Card.Header
			ref={ headerMeasureRef }
			className={ clsx(
				styles[ 'widget-header' ],
				overlay && styles.overlay
			) }
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

					{ widgetType.help && (
						<WidgetInfotip
							content={ widgetType.help.content }
							links={ widgetType.help.links }
						/>
					) }
				</Stack>
			) }

			{ children && (
				<div className={ styles.toolbar }>
					<WidgetHeaderAvailableSizeProvider value={ availableSize }>
						{ children }
					</WidgetHeaderAvailableSizeProvider>
				</div>
			) }
		</Card.Header>
	);
}
