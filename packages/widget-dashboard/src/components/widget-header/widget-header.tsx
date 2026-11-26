import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { inertValue } from '@wordpress/react-inert-value';
import { Card, Icon, Stack } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';
import { WidgetInfotip } from './widget-header-infotip';
import { useIsTruncated } from './use-is-truncated';
import {
	WidgetHeaderAvailableSizeProvider,
	WidgetHeaderIdentityFocusProvider,
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
	const [ identityWidth, setIdentityWidth ] = useState( 0 );
	const identityMeasureRef = useResizeObserver< HTMLDivElement >(
		( [ entry ] ) => {
			const { columnGap } = getComputedStyle(
				entry.target.parentElement as HTMLElement
			);

			setIdentityWidth(
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

	// A clipped title shows in the infotip, so it renders for a clip even
	// without a help note. Then it is what the title reclaims once un-clipped.
	const [ infotipReserve, setInfotipReserve ] = useState( 0 );
	const infotipMeasureRef = useResizeObserver< HTMLButtonElement >(
		( [ entry ] ) => {
			const { columnGap } = getComputedStyle(
				entry.target.parentElement as HTMLElement
			);
			setInfotipReserve(
				entry.borderBoxSize[ 0 ].inlineSize +
					( parseFloat( columnGap ) || 0 )
			);
		}
	);
	const [ titleMeasureRef, isTitleTruncated, titleOverflow ] =
		useIsTruncated< HTMLHeadingElement >(
			widgetType?.help ? 0 : infotipReserve
		);

	// The clipped part of the title is added back, so the inline controls give
	// way before the title truncates. It comes from the title's own observer:
	// an infotip that appears or leaves resizes the title, not the identity.
	const identityReserve = identityWidth + titleOverflow;

	// Focus in the identity (or the infotip's popup) holds the toolbar, so a
	// focused infotip can't unmount. Resolved on blur, as React renders
	// between a blur and the next focus.
	const identityRef = useRef< HTMLDivElement >( null );
	const identityRefs = useMergeRefs( [ identityRef, identityMeasureRef ] );
	const identityFocusEventRef = useRef< Event | null >( null );
	const [ identityHasFocus, setIdentityHasFocus ] = useState( false );

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
			onFocus={ ( event ) =>
				setIdentityHasFocus(
					event.nativeEvent === identityFocusEventRef.current
				)
			}
			onBlur={ ( event ) => {
				const next = event.relatedTarget as Node | null;
				if ( identityRef.current?.contains( next ) ) {
					setIdentityHasFocus( true );
				} else if ( ! event.currentTarget.contains( next ) ) {
					setIdentityHasFocus( false );
				}
			} }
		>
			{ showIdentity && widgetType?.title && (
				<Stack
					ref={ identityRefs }
					direction="row"
					align="center"
					gap="sm"
					className={ styles.identity }
					inert={ inertValue( editMode ) }
					onFocus={ ( event ) => {
						identityFocusEventRef.current = event.nativeEvent;
					} }
				>
					{ widgetType.icon && (
						<span className={ styles.icon } aria-hidden="true">
							<Icon icon={ widgetType.icon } />
						</span>
					) }

					<Card.Title
						ref={ titleMeasureRef }
						id={ titleId }
						render={ <h2 /> }
						className={ styles.title }
					>
						{ widgetType.title }
					</Card.Title>

					{ ( widgetType.help || isTitleTruncated ) && (
						<WidgetInfotip
							ref={ infotipMeasureRef }
							title={ widgetType.title }
							showTitle={ isTitleTruncated }
							content={ widgetType.help?.content }
							links={ widgetType.help?.links }
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
							<WidgetHeaderIdentityFocusProvider
								value={ identityHasFocus }
							>
								{ children }
							</WidgetHeaderIdentityFocusProvider>
						</WidgetHeaderAvailableSizeProvider>
					</WidgetHeaderReserveProvider>
				</div>
			) }
		</Card.Header>
	);
}
