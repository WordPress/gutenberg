import type { ForwardedRef } from 'react';
import clsx from 'clsx';
import { NavigableRegion } from '@wordpress/admin-ui';
import { forwardRef, useEffect } from '@wordpress/element';
import {
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import {
	useMergeRefs,
	useReducedMotion,
	useRefEffect,
	useViewportMatch,
} from '@wordpress/compose';
import type { InterfaceSkeletonProps } from './types';

const ANIMATION_DURATION = 0.25;
const commonTransition = {
	type: 'tween',
	duration: ANIMATION_DURATION,
	ease: [ 0.6, 0, 0.4, 1 ],
};

function useHTMLClass( className: string ) {
	useEffect( () => {
		const element =
			document && document.querySelector( `html:not(.${ className })` );
		if ( ! element ) {
			return;
		}
		element.classList.toggle( className );
		return () => {
			element.classList.toggle( className );
		};
	}, [ className ] );
}

const VISUAL_VIEWPORT_TOP_PROPERTY =
	'--wp-interface-skeleton--visual-viewport-top';
const VISUAL_VIEWPORT_BOTTOM_PROPERTY =
	'--wp-interface-skeleton--visual-viewport-bottom';

/**
 * Returns the deepest focused element, looking inside focused iframes such as
 * the editor canvas.
 */
function getDeepActiveElement( ownerDocument: Document ): Element | null {
	let element = ownerDocument.activeElement;
	while ( element?.tagName === 'IFRAME' ) {
		const { contentDocument } = element as HTMLIFrameElement;
		const innerElement = contentDocument?.activeElement;
		if ( ! innerElement || innerElement === contentDocument?.body ) {
			break;
		}
		element = innerElement;
	}
	return element;
}

/**
 * Returns the nearest ancestor of an element that scrolls vertically, falling
 * back to the element's document.
 */
function getScrollableAncestor( element: Element ): Element | null {
	const { defaultView } = element.ownerDocument;
	let node = element.parentElement;
	while ( node ) {
		const { overflowY } = defaultView!.getComputedStyle( node );
		if (
			/auto|scroll/.test( overflowY ) &&
			node.scrollHeight > node.clientHeight
		) {
			return node;
		}
		node = node.parentElement;
	}
	return element.ownerDocument.scrollingElement;
}

/**
 * Scrolls the caret of the focused text field back into view if it ended up
 * below the visible area.
 *
 * @param topDocument   The top-level document.
 * @param visibleBottom Bottom of the visible area, relative to the top-level
 *                      layout viewport.
 */
function scrollCaretIntoView( topDocument: Document, visibleBottom: number ) {
	// The element may belong to the canvas iframe, so `instanceof` checks
	// against this window's classes would fail.
	const element = getDeepActiveElement( topDocument ) as HTMLElement | null;
	if ( ! element?.isContentEditable ) {
		return;
	}

	const { ownerDocument } = element;
	const selection = ownerDocument.defaultView?.getSelection();
	if ( ! selection?.rangeCount ) {
		return;
	}

	let rect = selection.getRangeAt( 0 ).getBoundingClientRect();
	// Collapsed ranges in empty elements have no size.
	if ( ! rect.height ) {
		rect = element.getBoundingClientRect();
	}

	const frameTop =
		ownerDocument.defaultView?.frameElement?.getBoundingClientRect().top ??
		0;
	// Leave a little room between the caret and the keyboard.
	const overflow = frameTop + rect.bottom + 16 - visibleBottom;
	if ( overflow > 0 ) {
		getScrollableAncestor( element )?.scrollBy( 0, overflow );
	}
}

/**
 * Keeps the skeleton within the visual viewport on mobile.
 *
 * When the on-screen keyboard opens, iOS Safari does not resize the layout
 * viewport. It pans the visual viewport instead, which scrolls the fixed
 * header and block toolbar out of view. Following the visual viewport keeps
 * them visible above the keyboard.
 *
 * @param isEnabled Whether to follow the visual viewport.
 *
 * @return Ref callback for the skeleton element.
 */
function useFollowVisualViewport( isEnabled: boolean ) {
	return useRefEffect(
		( node: HTMLElement ) => {
			const { ownerDocument } = node;
			const visualViewport = ownerDocument.defaultView?.visualViewport;
			if ( ! isEnabled || ! visualViewport ) {
				return;
			}

			const { documentElement } = ownerDocument;
			const { style } = documentElement;
			let frame: number | undefined;
			let lastTop = 0;
			let lastBottom = 0;

			function update() {
				frame = undefined;
				// Don't follow the visual viewport while pinch zoomed, otherwise
				// the editor would shrink into the zoomed area.
				const isZoomed = Math.abs( visualViewport!.scale - 1 ) > 0.01;
				const top = isZoomed
					? 0
					: Math.max( 0, visualViewport!.offsetTop );
				const bottom = isZoomed
					? 0
					: Math.max(
							0,
							documentElement.clientHeight -
								visualViewport!.offsetTop -
								visualViewport!.height
						);

				if ( top === lastTop && bottom === lastBottom ) {
					return;
				}

				const hasVisibleAreaShrunk =
					top + bottom > lastTop + lastBottom;
				lastTop = top;
				lastBottom = bottom;
				style.setProperty( VISUAL_VIEWPORT_TOP_PROPERTY, `${ top }px` );
				style.setProperty(
					VISUAL_VIEWPORT_BOTTOM_PROPERTY,
					`${ bottom }px`
				);

				if ( hasVisibleAreaShrunk ) {
					scrollCaretIntoView(
						ownerDocument,
						documentElement.clientHeight - bottom
					);
				}
			}

			function scheduleUpdate() {
				if ( frame === undefined ) {
					frame =
						ownerDocument.defaultView!.requestAnimationFrame(
							update
						);
				}
			}

			update();
			visualViewport.addEventListener( 'resize', scheduleUpdate );
			visualViewport.addEventListener( 'scroll', scheduleUpdate );

			return () => {
				if ( frame !== undefined ) {
					ownerDocument.defaultView!.cancelAnimationFrame( frame );
				}
				visualViewport.removeEventListener( 'resize', scheduleUpdate );
				visualViewport.removeEventListener( 'scroll', scheduleUpdate );
				style.removeProperty( VISUAL_VIEWPORT_TOP_PROPERTY );
				style.removeProperty( VISUAL_VIEWPORT_BOTTOM_PROPERTY );
			};
		},
		[ isEnabled ]
	);
}

const headerVariants = {
	hidden: { opacity: 1, marginTop: -60 },
	visible: { opacity: 1, marginTop: 0 },
	distractionFreeHover: {
		opacity: 1,
		marginTop: 0,
		transition: {
			...commonTransition,
			delay: 0.2,
			delayChildren: 0.2,
		},
	},
	distractionFreeHidden: {
		opacity: 0,
		marginTop: -60,
	},
	distractionFreeDisabled: {
		opacity: 0,
		marginTop: 0,
		transition: {
			...commonTransition,
			delay: 0.8,
			delayChildren: 0.8,
		},
	},
};

function InterfaceSkeleton(
	{
		isDistractionFree,
		footer,
		header,
		editorNotices,
		sidebar,
		secondarySidebar,
		content,
		actions,
		labels,
		className,
	}: InterfaceSkeletonProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const disableMotion = useReducedMotion();
	const defaultTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : ANIMATION_DURATION,
		ease: [ 0.6, 0, 0.4, 1 ],
	};
	useHTMLClass( 'interface-interface-skeleton__html-container' );
	const followVisualViewportRef = useFollowVisualViewport( isMobileViewport );
	const mergedRef = useMergeRefs( [ ref, followVisualViewportRef ] );

	const defaultLabels = {
		/* translators: accessibility text for the top bar landmark region. */
		header: _x( 'Header', 'header landmark area' ),
		/* translators: accessibility text for the content landmark region. */
		body: __( 'Content' ),
		/* translators: accessibility text for the secondary sidebar landmark region. */
		secondarySidebar: __( 'Block Library' ),
		/* translators: accessibility text for the settings landmark region. */
		sidebar: _x( 'Settings', 'settings landmark area' ),
		/* translators: accessibility text for the publish landmark region. */
		actions: __( 'Publish' ),
		/* translators: accessibility text for the footer landmark region. */
		footer: __( 'Footer' ),
	};

	const mergedLabels = { ...defaultLabels, ...labels };

	return (
		<div
			ref={ mergedRef }
			className={ clsx(
				className,
				'interface-interface-skeleton',
				!! footer && 'has-footer'
			) }
		>
			<div className="interface-interface-skeleton__editor">
				<AnimatePresence initial={ false }>
					{ !! header && (
						<NavigableRegion
							as={ motion.div }
							className="interface-interface-skeleton__header"
							ariaLabel={ mergedLabels.header }
							initial={
								isDistractionFree && ! isMobileViewport
									? 'distractionFreeHidden'
									: 'hidden'
							}
							whileHover={
								isDistractionFree && ! isMobileViewport
									? 'distractionFreeHover'
									: 'visible'
							}
							animate={
								isDistractionFree && ! isMobileViewport
									? 'distractionFreeDisabled'
									: 'visible'
							}
							exit={
								isDistractionFree && ! isMobileViewport
									? 'distractionFreeHidden'
									: 'hidden'
							}
							variants={ headerVariants }
							transition={ defaultTransition }
						>
							{ header }
						</NavigableRegion>
					) }
				</AnimatePresence>
				{ isDistractionFree && (
					<div className="interface-interface-skeleton__header">
						{ editorNotices }
					</div>
				) }
				<div className="interface-interface-skeleton__body">
					<AnimatePresence initial={ false }>
						{ !! secondarySidebar && (
							<NavigableRegion
								className="interface-interface-skeleton__secondary-sidebar"
								ariaLabel={ mergedLabels.secondarySidebar }
								as={ motion.div }
								initial="closed"
								animate="open"
								exit="closed"
								// `auto` leaves the open width to the panel, so a
								// sidebar that is already open on page load is
								// at its full width on the first paint instead
								// of animating there. framer-motion measures
								// the element to animate, then restores `auto`.
								variants={ {
									open: { width: 'auto' },
									closed: { width: 0 },
								} }
								transition={ defaultTransition }
							>
								<motion.div
									style={ {
										width: isMobileViewport
											? '100vw'
											: 'max-content',
										height: '100%',
									} }
									variants={ {
										open: { x: 0 },
										closed: { x: '-100%' },
									} }
									transition={ defaultTransition }
								>
									{ secondarySidebar }
								</motion.div>
							</NavigableRegion>
						) }
					</AnimatePresence>
					<NavigableRegion
						className="interface-interface-skeleton__content"
						ariaLabel={ mergedLabels.body }
					>
						{ content }
					</NavigableRegion>
					{ !! sidebar && (
						<NavigableRegion
							className="interface-interface-skeleton__sidebar"
							ariaLabel={ mergedLabels.sidebar }
						>
							{ sidebar }
						</NavigableRegion>
					) }
					{ !! actions && (
						<NavigableRegion
							className="interface-interface-skeleton__actions"
							ariaLabel={ mergedLabels.actions }
						>
							{ actions }
						</NavigableRegion>
					) }
				</div>
			</div>
			{ !! footer && (
				<NavigableRegion
					className="interface-interface-skeleton__footer"
					ariaLabel={ mergedLabels.footer }
				>
					{ footer }
				</NavigableRegion>
			) }
		</div>
	);
}

export default forwardRef( InterfaceSkeleton );
