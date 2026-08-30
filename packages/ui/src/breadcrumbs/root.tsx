import { mergeProps, useRender } from '@base-ui/react';
import clsx from 'clsx';
import { useIsomorphicLayoutEffect, useMergeRefs } from '@wordpress/compose';
import {
	Children,
	forwardRef,
	isValidElement,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { Button } from '../button';
import * as Menu from '../menu';
import type { RootProps as MenuRootProps } from '../menu/types';
import * as Tooltip from '../tooltip';
import defenseStyles from '../utils/css/global-css-defense.module.css';
import resetStyles from '../utils/css/resets.module.css';
import { BreadcrumbItemRenderContext } from './context';
import { CurrentItem } from './current-item';
import { enforceRenderProps } from './enforce-render-props';
import { getCollapsedLayout } from './layout';
import { LinkItem } from './link-item';
import { Separator } from './separator';
import styles from './style.module.css';
import type { CurrentItemProps, LinkItemProps, RootProps } from './types';

type BreadcrumbItemDescriptor = {
	element: ReactElement< LinkItemProps | CurrentItemProps >;
	itemKey: string;
	kind: 'link' | 'current';
	label: string;
	measurementClassName?: string;
	measurementStyle?: CSSProperties;
};

type ResponsiveState = {
	collapsedKeys: string[];
	shouldTruncateCurrent: boolean;
};

const FULL_TRAIL_STATE: ResponsiveState = {
	collapsedKeys: [],
	shouldTruncateCurrent: false,
};

function validateNestedArrayKeys( children: ReactNode ) {
	if ( ! Array.isArray( children ) ) {
		return;
	}

	for ( const child of children ) {
		if ( ! Array.isArray( child ) ) {
			continue;
		}

		for ( const arrayChild of child ) {
			if ( isValidElement( arrayChild ) && arrayChild.key === null ) {
				throw new Error(
					'Breadcrumbs: Items rendered from an array need stable React keys.'
				);
			}
		}
		validateNestedArrayKeys( child );
	}
}

function getBreadcrumbItems( children: ReactNode ) {
	if ( process.env.NODE_ENV !== 'production' ) {
		validateNestedArrayKeys( children );
	}

	const childArray = Children.toArray( children );
	const items: BreadcrumbItemDescriptor[] = [];

	childArray.forEach( ( child, index ) => {
		if ( ! isValidElement< LinkItemProps | CurrentItemProps >( child ) ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				throw new Error(
					'Breadcrumbs: <Breadcrumbs.Root> only accepts <Breadcrumbs.LinkItem> and <Breadcrumbs.CurrentItem> as direct children.'
				);
			}
			return;
		}

		let kind: BreadcrumbItemDescriptor[ 'kind' ] | undefined;
		if ( child.type === LinkItem ) {
			kind = 'link';
		} else if ( child.type === CurrentItem ) {
			kind = 'current';
		}

		if ( ! kind ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				throw new Error(
					'Breadcrumbs: <Breadcrumbs.Root> only accepts <Breadcrumbs.LinkItem> and <Breadcrumbs.CurrentItem> as direct children.'
				);
			}
			return;
		}

		const label = child.props.children;
		if ( typeof label !== 'string' || ! label.trim() ) {
			if ( process.env.NODE_ENV !== 'production' ) {
				throw new Error(
					`Breadcrumbs: <Breadcrumbs.${
						kind === 'link' ? 'LinkItem' : 'CurrentItem'
					}> requires a non-empty text label.`
				);
			}
			return;
		}

		if (
			kind === 'link' &&
			( typeof ( child.props as LinkItemProps ).href !== 'string' ||
				! ( child.props as LinkItemProps ).href.trim() )
		) {
			if ( process.env.NODE_ENV !== 'production' ) {
				throw new Error(
					'Breadcrumbs: <Breadcrumbs.LinkItem> requires a usable `href`.'
				);
			}
			return;
		}

		const renderElement = isValidElement< {
			className?: string;
			style?: CSSProperties;
		} >( child.props.render )
			? child.props.render
			: undefined;

		items.push( {
			element: child,
			itemKey: String( child.key ?? `item-${ index }` ),
			kind,
			label,
			measurementClassName: clsx(
				child.props.className,
				renderElement?.props.className
			),
			measurementStyle: {
				...child.props.style,
				...renderElement?.props.style,
			},
		} );
	} );

	if ( process.env.NODE_ENV !== 'production' ) {
		const linkItems = items.filter( ( item ) => item.kind === 'link' );
		const currentItems = items.filter(
			( item ) => item.kind === 'current'
		);

		if ( linkItems.length === 0 ) {
			throw new Error(
				'Breadcrumbs: <Breadcrumbs.Root> requires at least one <Breadcrumbs.LinkItem>.'
			);
		}
		if ( currentItems.length === 0 ) {
			throw new Error(
				'Breadcrumbs: <Breadcrumbs.Root> requires one final <Breadcrumbs.CurrentItem>.'
			);
		}
		if ( currentItems.length > 1 ) {
			throw new Error(
				'Breadcrumbs: <Breadcrumbs.Root> accepts exactly one <Breadcrumbs.CurrentItem>.'
			);
		}
		if ( items.at( -1 )?.kind !== 'current' ) {
			throw new Error(
				'Breadcrumbs: <Breadcrumbs.CurrentItem> must be the final child of <Breadcrumbs.Root>.'
			);
		}
	}

	return items;
}

function responsiveStatesAreEqual(
	current: ResponsiveState,
	next: ResponsiveState
) {
	return (
		current.shouldTruncateCurrent === next.shouldTruncateCurrent &&
		current.collapsedKeys.length === next.collapsedKeys.length &&
		current.collapsedKeys.every(
			( itemKey, index ) => itemKey === next.collapsedKeys[ index ]
		)
	);
}

function itemKeysAreEqual(
	current: BreadcrumbItemDescriptor[],
	next: BreadcrumbItemDescriptor[]
) {
	return (
		current.length === next.length &&
		current.every(
			( item, index ) => item.itemKey === next[ index ].itemKey
		)
	);
}

function getContentBoxInlineSize( element: HTMLElement ) {
	const computedStyles = getComputedStyle( element );
	const shorthandValues = computedStyles.paddingInline
		.split( /\s+/ )
		.map( ( value ) => Number.parseFloat( value ) )
		.filter( Number.isFinite );
	const shorthandStart = shorthandValues[ 0 ] ?? 0;
	const shorthandEnd = shorthandValues[ 1 ] ?? shorthandStart;
	const paddingInlineStart =
		Number.parseFloat( computedStyles.paddingInlineStart ) ||
		Number.parseFloat( computedStyles.paddingLeft ) ||
		shorthandStart;
	const paddingInlineEnd =
		Number.parseFloat( computedStyles.paddingInlineEnd ) ||
		Number.parseFloat( computedStyles.paddingRight ) ||
		shorthandEnd;
	const paddingBoxWidth =
		element.clientWidth || element.getBoundingClientRect().width;

	return Math.max(
		0,
		paddingBoxWidth - paddingInlineStart - paddingInlineEnd
	);
}

/**
 * Renders a labelled breadcrumb navigation landmark and automatically moves
 * ancestors that do not fit into an accessible overflow menu.
 *
 * ```jsx
 * <Breadcrumbs.Root aria-label="Breadcrumbs">
 *   <Breadcrumbs.LinkItem href="/">Dashboard</Breadcrumbs.LinkItem>
 *   <Breadcrumbs.CurrentItem>Settings</Breadcrumbs.CurrentItem>
 * </Breadcrumbs.Root>
 * ```
 */
const Root = forwardRef< HTMLElement, RootProps >( function BreadcrumbsRoot(
	{
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		children,
		className,
		render,
		role: _role,
		...props
	},
	forwardedRef
) {
	const items = useMemo( () => getBreadcrumbItems( children ), [ children ] );
	const linkItems = useMemo(
		() => items.filter( ( item ) => item.kind === 'link' ),
		[ items ]
	);
	const currentItem = useMemo(
		() => items.find( ( item ) => item.kind === 'current' ),
		[ items ]
	);
	const [ rootElement, setRootElement ] = useState< HTMLElement | null >(
		null
	);
	const [ responsiveState, setResponsiveState ] =
		useState< ResponsiveState >( FULL_TRAIL_STATE );
	const [ measurementVersion, setMeasurementVersion ] = useState( 0 );
	const [ menuOpen, setMenuOpen ] = useState( false );
	const [ pinnedItemKey, setPinnedItemKey ] = useState< string | null >(
		null
	);
	const [ isOverflowTriggerFocused, setIsOverflowTriggerFocused ] =
		useState( false );
	const mergedRootRef = useMergeRefs( [ forwardedRef, setRootElement ] );
	const visibleListRef = useRef< HTMLOListElement | null >( null );
	const intrinsicRowRef = useRef< HTMLDivElement | null >( null );
	const intrinsicItemRefs = useRef( new Map< string, HTMLSpanElement >() );
	const intrinsicSeparatorRef = useRef< HTMLSpanElement | null >( null );
	const intrinsicOverflowTriggerRef = useRef< HTMLSpanElement | null >(
		null
	);
	const overflowTriggerRef = useRef< HTMLButtonElement | null >( null );
	const frozenItemsRef = useRef( items );
	const pendingStateRef = useRef< ResponsiveState | null >( null );
	const focusOverflowAfterLayoutRef = useRef( false );
	const menuOpenRef = useRef( false );

	if ( ! menuOpen && ! isOverflowTriggerFocused ) {
		frozenItemsRef.current = items;
	}

	const applyResponsiveState = useCallback(
		( next: ResponsiveState ) => {
			if ( menuOpen ) {
				pendingStateRef.current = next;
				return;
			}

			if (
				isOverflowTriggerFocused &&
				( next.collapsedKeys.length === 0 ||
					! itemKeysAreEqual( frozenItemsRef.current, items ) )
			) {
				pendingStateRef.current = next;
				return;
			}

			pendingStateRef.current = null;
			setResponsiveState( ( current ) =>
				responsiveStatesAreEqual( current, next ) ? current : next
			);
		},
		[ isOverflowTriggerFocused, items, menuOpen ]
	);

	useIsomorphicLayoutEffect( () => {
		if ( ! rootElement || ! intrinsicRowRef.current ) {
			return;
		}

		if ( typeof ResizeObserver !== 'function' ) {
			applyResponsiveState( FULL_TRAIL_STATE );
			return;
		}

		let isActive = true;
		let animationFrame: number | undefined;
		const measureElement = ( element: HTMLElement | null ) => {
			if ( ! element ) {
				return 0;
			}
			return Math.max(
				element.getBoundingClientRect().width,
				element.scrollWidth
			);
		};
		const measure = () => {
			if ( ! isActive ) {
				return;
			}

			const availableWidth = visibleListRef.current
				? getContentBoxInlineSize( visibleListRef.current )
				: rootElement.clientWidth ||
				  rootElement.getBoundingClientRect().width;
			const currentItemWidth = currentItem
				? measureElement(
						intrinsicItemRefs.current.get( currentItem.itemKey ) ??
							null
				  )
				: 0;
			const linkItemWidths = linkItems.map( ( item ) =>
				measureElement(
					intrinsicItemRefs.current.get( item.itemKey ) ?? null
				)
			);
			const pinnedIndex = pinnedItemKey
				? linkItems.findIndex(
						( item ) => item.itemKey === pinnedItemKey
				  )
				: undefined;
			const nextLayout = getCollapsedLayout(
				{
					availableWidth,
					currentItemWidth,
					linkItemWidths,
					overflowTriggerWidth: measureElement(
						intrinsicOverflowTriggerRef.current
					),
					separatorWidth: measureElement(
						intrinsicSeparatorRef.current
					),
				},
				pinnedIndex === -1 ? undefined : pinnedIndex
			);
			const nextState = {
				collapsedKeys: nextLayout.collapsedIndices.map(
					( index ) => linkItems[ index ].itemKey
				),
				shouldTruncateCurrent: nextLayout.shouldTruncateCurrent,
			};

			if ( nextLayout.shouldMoveFocusToOverflow ) {
				focusOverflowAfterLayoutRef.current = true;
				setPinnedItemKey( null );
			}

			setMeasurementVersion( ( current ) => current + 1 );
			applyResponsiveState( nextState );
		};
		const scheduleMeasurement = () => {
			if ( animationFrame !== undefined ) {
				return;
			}
			animationFrame = requestAnimationFrame( () => {
				animationFrame = undefined;
				measure();
			} );
		};

		const resizeObserver = new ResizeObserver( scheduleMeasurement );
		resizeObserver.observe( rootElement );
		if ( visibleListRef.current ) {
			resizeObserver.observe( visibleListRef.current );
		}
		resizeObserver.observe( intrinsicRowRef.current );
		for ( const itemElement of intrinsicItemRefs.current.values() ) {
			resizeObserver.observe( itemElement );
		}
		if ( intrinsicSeparatorRef.current ) {
			resizeObserver.observe( intrinsicSeparatorRef.current );
		}
		if ( intrinsicOverflowTriggerRef.current ) {
			resizeObserver.observe( intrinsicOverflowTriggerRef.current );
		}

		measure();

		if ( document.fonts ) {
			document.fonts.ready.then( scheduleMeasurement );
		}

		return () => {
			isActive = false;
			resizeObserver.disconnect();
			if ( animationFrame !== undefined ) {
				cancelAnimationFrame( animationFrame );
			}
		};
	}, [
		applyResponsiveState,
		children,
		currentItem,
		linkItems,
		pinnedItemKey,
		props.dir,
		rootElement,
	] );

	useIsomorphicLayoutEffect( () => {
		if (
			focusOverflowAfterLayoutRef.current &&
			responsiveState.collapsedKeys.length > 0 &&
			overflowTriggerRef.current
		) {
			focusOverflowAfterLayoutRef.current = false;
			overflowTriggerRef.current.focus();
		}
	}, [ responsiveState.collapsedKeys.length ] );

	const applyPendingResponsiveState = useCallback( () => {
		if ( ! pendingStateRef.current ) {
			return;
		}

		const pendingState = pendingStateRef.current;
		pendingStateRef.current = null;
		setResponsiveState( pendingState );
	}, [] );

	const handleMenuOpenChange = useCallback(
		(
			open: boolean,
			eventDetails: Parameters<
				NonNullable< MenuRootProps[ 'onOpenChange' ] >
			>[ 1 ]
		) => {
			menuOpenRef.current = open;
			if ( open ) {
				frozenItemsRef.current = items;
			} else if (
				eventDetails.reason !== 'escape-key' &&
				eventDetails.reason !== 'trigger-press'
			) {
				setIsOverflowTriggerFocused( false );
				applyPendingResponsiveState();
			}
			setMenuOpen( open );
		},
		[ applyPendingResponsiveState, items ]
	);
	const handleOverflowTriggerBlur = useCallback( () => {
		if ( menuOpenRef.current ) {
			return;
		}
		setIsOverflowTriggerFocused( false );
		applyPendingResponsiveState();
	}, [ applyPendingResponsiveState ] );

	const displayedItems =
		menuOpen || isOverflowTriggerFocused ? frozenItemsRef.current : items;
	const displayedLinks = displayedItems.filter(
		( item ) => item.kind === 'link'
	);
	const displayedCurrentItem = displayedItems.find(
		( item ) => item.kind === 'current'
	);
	const collapsedKeySet = new Set( responsiveState.collapsedKeys );
	const collapsedItems = displayedLinks.filter( ( item ) =>
		collapsedKeySet.has( item.itemKey )
	);
	const visibleLinks = displayedLinks.filter(
		( item ) => ! collapsedKeySet.has( item.itemKey )
	);
	const overflowLabel = collapsedItems.length
		? sprintf(
				/* translators: %d: number of breadcrumb links hidden in the overflow menu. */
				_n(
					'Show %d hidden breadcrumb item',
					'Show %d hidden breadcrumb items',
					collapsedItems.length
				),
				collapsedItems.length
		  )
		: '';

	let visiblePosition = 0;
	const renderVisibleItem = ( item: BreadcrumbItemDescriptor ) => {
		const showSeparator = visiblePosition > 0;
		visiblePosition++;

		return (
			<BreadcrumbItemRenderContext.Provider
				key={ `visible-${ item.itemKey }` }
				value={ {
					itemKey: item.itemKey,
					measurementVersion,
					mode: 'visible',
					onLinkBlur: ( itemKey ) =>
						setPinnedItemKey( ( current ) =>
							current === itemKey ? null : current
						),
					onLinkFocus: setPinnedItemKey,
					showSeparator,
					shouldTruncateCurrent:
						responsiveState.shouldTruncateCurrent,
				} }
			>
				{ item.element }
			</BreadcrumbItemRenderContext.Provider>
		);
	};
	const rootLink = visibleLinks.find(
		( item ) => item.itemKey === displayedLinks[ 0 ]?.itemKey
	);
	const remainingVisibleLinks = rootLink
		? visibleLinks.filter( ( item ) => item !== rootLink )
		: visibleLinks;
	const visibleListContent = (
		<>
			{ rootLink && renderVisibleItem( rootLink ) }
			{ collapsedItems.length > 0 && (
				<li className={ clsx( defenseStyles.li, styles.item ) }>
					{ visiblePosition++ > 0 && <Separator /> }
					<Menu.Root onOpenChange={ handleMenuOpenChange }>
						<Tooltip.Root disabled={ menuOpen }>
							<Menu.Trigger
								ref={ overflowTriggerRef }
								aria-label={ overflowLabel }
								className={ styles[ 'overflow-trigger' ] }
								onBlur={ handleOverflowTriggerBlur }
								onFocus={ () =>
									setIsOverflowTriggerFocused( true )
								}
								render={
									<Tooltip.Trigger
										render={
											<Button
												size="small"
												tone="neutral"
												variant="minimal"
											/>
										}
									/>
								}
							>
								<span aria-hidden="true">…</span>
							</Menu.Trigger>
							<Tooltip.Popup>{ overflowLabel }</Tooltip.Popup>
						</Tooltip.Root>
						<Menu.Popup>
							{ collapsedItems.map( ( item ) => (
								<BreadcrumbItemRenderContext.Provider
									key={ `overflow-${ item.itemKey }` }
									value={ {
										itemKey: item.itemKey,
										measurementVersion,
										mode: 'overflow',
										onLinkBlur: () => {},
										onLinkFocus: () => {},
										showSeparator: false,
										shouldTruncateCurrent: false,
									} }
								>
									{ item.element }
								</BreadcrumbItemRenderContext.Provider>
							) ) }
						</Menu.Popup>
					</Menu.Root>
				</li>
			) }
			{ remainingVisibleLinks.map( renderVisibleItem ) }
			{ displayedCurrentItem &&
				renderVisibleItem( displayedCurrentItem ) }
		</>
	);
	const inertProps = { inert: '' } as Record< string, string >;
	const componentContent = (
		<>
			<ol
				ref={ visibleListRef }
				className={ clsx( defenseStyles.ol, styles.list ) }
			>
				{ visibleListContent }
			</ol>
			<div
				{ ...inertProps }
				aria-hidden="true"
				className={ styles.measurement }
			>
				<div
					ref={ intrinsicRowRef }
					className={ styles[ 'measurement-row' ] }
				>
					{ items.map( ( item, index ) => (
						<span
							key={ item.itemKey }
							className={ styles[ 'measurement-item' ] }
						>
							{ index > 0 && (
								<span
									ref={
										index === 1
											? intrinsicSeparatorRef
											: undefined
									}
									className={ styles.separator }
								>
									/
								</span>
							) }
							<span
								ref={ ( element ) => {
									if ( element ) {
										intrinsicItemRefs.current.set(
											item.itemKey,
											element
										);
									} else {
										intrinsicItemRefs.current.delete(
											item.itemKey
										);
									}
								} }
								className={ styles[ 'measurement-content' ] }
							>
								<span
									className={ clsx(
										styles.label,
										styles[ 'measurement-label' ],
										item.measurementClassName
									) }
									style={ item.measurementStyle }
								>
									{ item.label }
								</span>
							</span>
						</span>
					) ) }
				</div>
				<span
					ref={ intrinsicOverflowTriggerRef }
					className={ styles[ 'measurement-overflow-trigger' ] }
				>
					…
				</span>
			</div>
		</>
	);
	const hasAriaLabel =
		typeof ariaLabel === 'string' && ariaLabel.trim().length > 0;
	const hasAriaLabelledBy =
		typeof ariaLabelledBy === 'string' && ariaLabelledBy.trim().length > 0;
	const resolvedAriaLabel =
		hasAriaLabel || hasAriaLabelledBy ? ariaLabel : __( 'Breadcrumbs' );
	const enforcedRender = useMemo(
		() =>
			enforceRenderProps( render, {
				'aria-label': resolvedAriaLabel,
				'aria-labelledby': hasAriaLabelledBy
					? ariaLabelledBy
					: undefined,
				role: 'navigation',
			} ),
		[ ariaLabelledBy, hasAriaLabelledBy, render, resolvedAriaLabel ]
	);
	const root = useRender( {
		render: enforcedRender,
		defaultTagName: 'nav',
		ref: mergedRootRef,
		props: mergeProps< 'nav' >( props, {
			'aria-label': resolvedAriaLabel,
			'aria-labelledby': hasAriaLabelledBy ? ariaLabelledBy : undefined,
			children: componentContent,
			className: clsx(
				resetStyles[ 'box-sizing' ],
				styles.root,
				className
			),
			role: 'navigation',
		} ),
	} );

	return root;
} );

Root.displayName = 'Breadcrumbs.Root';

export { Root };
