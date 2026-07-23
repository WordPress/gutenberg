/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { Card, Icon, Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetInfotip } from './widget-header-infotip';
import {
	WidgetHeaderAvailableSizeProvider,
	WidgetHeaderReserveProvider,
} from './widget-header-fit';
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

	// Actual footprint of the identity cluster plus the gap before the toolbar.
	// Measured, so whatever identity holds (a help tip, a future badge) is
	// reserved without a per-element constant.
	const [ identityReserve, setIdentityReserve ] = useState( 0 );
	const identityMeasureRef = useResizeObserver< HTMLDivElement >(
		( [ entry ] ) => {
			const { columnGap } = getComputedStyle(
				entry.target.parentElement as HTMLElement
			);

			setIdentityReserve(
				entry.contentRect.width + ( parseFloat( columnGap ) || 0 )
			);
		}
	);

	// Everything in the toolbar the collapsible controls cannot use: the chip's
	// own padding, and each section beside them (the actions menu, and whatever
	// the header gains next). Each reports itself; the sum leaves the budget.
	const [ reserved, setReserved ] = useState< Record< string, number > >(
		{}
	);
	const registerReserved = useCallback( ( id: string, width: number ) => {
		setReserved( ( current ) =>
			current[ id ] === width ? current : { ...current, [ id ]: width }
		);
	}, [] );

	const unregisterReserved = useCallback( ( id: string ) => {
		setReserved( ( current ) => {
			if ( ! ( id in current ) ) {
				return current;
			}
			const next = { ...current };
			delete next[ id ];
			return next;
		} );
	}, [] );

	const reserveContext = useMemo(
		() => ( { registerReserved, unregisterReserved } ),
		[ registerReserved, unregisterReserved ]
	);

	const hasIdentity = showIdentity && !! widgetType?.title;
	const totalReserved = Object.values( reserved ).reduce(
		( sum, width ) => sum + width,
		0
	);

	const availableSize =
		headerWidth > 0
			? headerWidth -
			  ( hasIdentity ? identityReserve : 0 ) -
			  totalReserved
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
					ref={ identityMeasureRef }
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

					<Card.Title
						id={ titleId }
						render={ <h2 /> }
						className={ styles.title }
					>
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
					<WidgetHeaderReserveProvider value={ reserveContext }>
						<WidgetHeaderAvailableSizeProvider
							value={ availableSize }
						>
							{ children }
						</WidgetHeaderAvailableSizeProvider>
					</WidgetHeaderReserveProvider>
				</div>
			) }
		</Card.Header>
	);
}
