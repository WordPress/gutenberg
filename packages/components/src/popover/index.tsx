/**
 * External dependencies
 */
import type { ForwardedRef, SyntheticEvent, RefCallback } from 'react';
import clsx from 'clsx';
import {
	useFloating,
	flip as flipMiddleware,
	shift as shiftMiddleware,
	limitShift,
	autoUpdate,
	arrow,
	offset as offsetMiddleware,
	size,
} from '@floating-ui/react-dom';
import type { HTMLMotionProps, MotionProps } from 'framer-motion';
import { motion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useLayoutEffect,
	forwardRef,
	createContext,
	useContext,
	useMemo,
	useState,
	useCallback,
	createPortal,
} from '@wordpress/element';
import {
	useReducedMotion,
	useViewportMatch,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';
import { Path, SVG } from '@wordpress/primitives';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';
import {
	computePopoverPosition,
	positionToPlacement,
	placementToMotionAnimationProps,
	getReferenceElement,
} from './utils';
import { contextConnect, useContextSystem } from '../context';
import type { WordPressComponentProps } from '../context';
import type {
	PopoverProps,
	PopoverAnchorRefReference,
	PopoverAnchorRefTopBottom,
	PopoverSlotProps,
} from './types';
import { overlayMiddlewares } from './overlay-middlewares';
import { StyleProvider } from '../style-provider';

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
export const SLOT_NAME = 'Popover';

/**
 * Virtual padding to account for overflow boundaries.
 *
 * @type {number}
 */
const OVERFLOW_PADDING = 8;

// An SVG displaying a triangle facing down, filled with a solid
// color and bordered in such a way to create an arrow-like effect.
// Keeping the SVG's viewbox squared simplify the arrow positioning
// calculations.
const ArrowTriangle = () => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 100 100"
		className="components-popover__triangle"
		role="presentation"
	>
		<Path
			className="components-popover__triangle-bg"
			d="M 0 0 L 50 50 L 100 0"
		/>
		<Path
			className="components-popover__triangle-border"
			d="M 0 0 L 50 50 L 100 0"
			vectorEffect="non-scaling-stroke"
		/>
	</SVG>
);

const slotNameContext = createContext< string | undefined >( undefined );
slotNameContext.displayName = '__unstableSlotNameContext';

const fallbackContainerClassname = 'components-popover__fallback-container';
const getPopoverFallbackContainer = () => {
	let container = document.body.querySelector(
		'.' + fallbackContainerClassname
	);
	if ( ! container ) {
		container = document.createElement( 'div' );
		container.className = fallbackContainerClassname;
		document.body.append( container );
	}

	return container;
};

const UnforwardedPopover = (
	props: Omit<
		WordPressComponentProps< PopoverProps, 'div', false >,
		// To avoid overlaps between the standard HTML attributes and the props
		// expected by `framer-motion`, omit all framer motion props from popover
		// props (except for `animate` and `children` which are re-defined in
		// `PopoverProps`, and `style` which is merged safely).
		keyof Omit< MotionProps, 'animate' | 'children' | 'style' >
	>,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		animate = true,
		headerTitle,
		constrainTabbing,
		onClose,
		children,
		className,
		noArrow = true,
		position,
		placement: placementProp = 'bottom-start',
		offset: offsetProp = 0,
		focusOnMount = 'firstElement',
		anchor,
		expandOnMobile,
		onFocusOutside,
		__unstableSlotName = SLOT_NAME,
		flip = true,
		resize = true,
		shift = false,
		inline = false,
		variant,
		style: contentStyle,

		// Deprecated props
		__unstableForcePosition,
		anchorRef,
		anchorRect,
		getAnchorRect,
		isAlternate,

		// Rest
		...contentProps
	} = useContextSystem( props, 'Popover' );

	let computedFlipProp = flip;
	let computedResizeProp = resize;
	if ( __unstableForcePosition !== undefined ) {
		deprecated( '`__unstableForcePosition` prop in wp.components.Popover', {
			since: '6.1',
			version: '6.3',
			alternative: '`flip={ false }` and  `resize={ false }`',
		} );

		// Back-compat, set the `flip` and `resize` props
		// to `false` to replicate `__unstableForcePosition`.
		computedFlipProp = ! __unstableForcePosition;
		computedResizeProp = ! __unstableForcePosition;
	}

	if ( anchorRef !== undefined ) {
		deprecated( '`anchorRef` prop in wp.components.Popover', {
			since: '6.1',
			alternative: '`anchor` prop',
		} );
	}

	if ( anchorRect !== undefined ) {
		deprecated( '`anchorRect` prop in wp.components.Popover', {
			since: '6.1',
			alternative: '`anchor` prop',
		} );
	}

	if ( getAnchorRect !== undefined ) {
		deprecated( '`getAnchorRect` prop in wp.components.Popover', {
			since: '6.1',
			alternative: '`anchor` prop',
		} );
	}

	const computedVariant = isAlternate ? 'toolbar' : variant;
	if ( isAlternate !== undefined ) {
		deprecated( '`isAlternate` prop in wp.components.Popover', {
			since: '6.2',
			alternative: "`variant` prop with the `'toolbar'` value",
		} );
	}

	const arrowRef = useRef< HTMLElement | null >( null );

	const [ fallbackReferenceElement, setFallbackReferenceElement ] =
		useState< HTMLSpanElement | null >( null );

	const anchorRefFallback: RefCallback< HTMLSpanElement > = useCallback(
		( node ) => {
			setFallbackReferenceElement( node );
		},
		[]
	);

	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isExpanded = expandOnMobile && isMobileViewport;
	const hasArrow = ! isExpanded && ! noArrow;
	const normalizedPlacementFromProps = position
		? positionToPlacement( position )
		: placementProp;

	const middleware = [
		...( placementProp === 'overlay' ? overlayMiddlewares() : [] ),
		offsetMiddleware( offsetProp ),
		computedFlipProp && flipMiddleware(),
		computedResizeProp &&
			size( {
				padding: OVERFLOW_PADDING,
				apply( sizeProps ) {
					const { firstElementChild } = refs.floating.current ?? {};

					// Only HTMLElement instances have the `style` property.
					if ( ! ( firstElementChild instanceof HTMLElement ) ) {
						return;
					}

					// Reduce the height of the popover to the available space.
					Object.assign( firstElementChild.style, {
						maxHeight: `${ Math.max(
							0,
							sizeProps.availableHeight
						) }px`,
						overflow: 'auto',
					} );
				},
			} ),
		shift &&
			shiftMiddleware( {
				crossAxis: true,
				limiter: limitShift(),
				padding: 1, // Necessary to avoid flickering at the edge of the viewport.
			} ),
		arrow( { element: arrowRef } ),
	];
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );

	let onDialogClose;

	if ( onClose || onFocusOutside ) {
		onDialogClose = ( type: string | undefined, event: SyntheticEvent ) => {
			// Ideally the popover should have just a single onClose prop and
			// not three props that potentially do the same thing.
			if ( type === 'focus-outside' ) {
				// Check if this blur event is actually relevant to this popover
				const blurTarget = event?.target as Element;
				const referenceElement = refs.reference.current;
				const floatingElement = refs.floating.current;

				// Check if blur is from this popover's reference element or its floating content
				const isBlurFromThisPopover =
					( referenceElement &&
						'contains' in referenceElement &&
						referenceElement.contains( blurTarget ) ) ||
					floatingElement?.contains( blurTarget );
				// Only proceed if the blur is actually from this popover
				if ( ! isBlurFromThisPopover ) {
					return;
				}
				// Call onFocusOutside if defined or call onClose.
				if ( onFocusOutside ) {
					onFocusOutside( event );
				} else if ( onClose ) {
					onClose();
				}
			} else if ( onClose ) {
				// onClose should be called for other event types if it exists.
				onClose();
			}
		};
	}

	const [ dialogRef, dialogProps ] = useDialog( {
		constrainTabbing,
		focusOnMount,
		__unstableOnClose: onDialogClose,
		// @ts-expect-error The __unstableOnClose property needs to be deprecated first (see https://github.com/WordPress/gutenberg/pull/27675)
		onClose: onDialogClose,
	} );

	const {
		// Positioning coordinates
		x,
		y,
		// Object with "regular" refs to both "reference" and "floating"
		refs,
		// Type of CSS position property to use (absolute or fixed)
		strategy,
		update,
		placement: computedPlacement,
		middlewareData: { arrow: arrowData },
	} = useFloating( {
		placement:
			normalizedPlacementFromProps === 'overlay'
				? undefined
				: normalizedPlacementFromProps,
		middleware,
		whileElementsMounted: ( referenceParam, floatingParam, updateParam ) =>
			autoUpdate( referenceParam, floatingParam, updateParam, {
				layoutShift: false,
				animationFrame: true,
			} ),
	} );

	const arrowCallbackRef = useCallback(
		( node: HTMLElement | null ) => {
			arrowRef.current = node;
			update();
		},
		[ update ]
	);

	// When any of the possible anchor "sources" change,
	// recompute the reference element (real or virtual) and its owner document.

	const anchorRefTop = ( anchorRef as PopoverAnchorRefTopBottom | undefined )
		?.top;
	const anchorRefBottom = (
		anchorRef as PopoverAnchorRefTopBottom | undefined
	 )?.bottom;
	const anchorRefStartContainer = ( anchorRef as Range | undefined )
		?.startContainer;
	const anchorRefCurrent = ( anchorRef as PopoverAnchorRefReference )
		?.current;

	useLayoutEffect( () => {
		const resultingReferenceElement = getReferenceElement( {
			anchor,
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
		} );

		refs.setReference( resultingReferenceElement );
	}, [
		anchor,
		anchorRef,
		anchorRefTop,
		anchorRefBottom,
		anchorRefStartContainer,
		anchorRefCurrent,
		anchorRect,
		getAnchorRect,
		fallbackReferenceElement,
		refs,
	] );

	const mergedFloatingRef = useMergeRefs( [
		refs.setFloating,
		dialogRef,
		forwardedRef,
	] );

	const style = isExpanded
		? undefined
		: {
				position: strategy,
				top: 0,
				left: 0,
				// `x` and `y` are framer-motion specific props and are shorthands
				// for `translateX` and `translateY`. Currently it is not possible
				// to use `translateX` and `translateY` because those values would
				// be overridden by the return value of the
				// `placementToMotionAnimationProps` function.
				x: computePopoverPosition( x ),
				y: computePopoverPosition( y ),
		  };

	const shouldReduceMotion = useReducedMotion();
	const shouldAnimate = animate && ! isExpanded && ! shouldReduceMotion;

	const [ animationFinished, setAnimationFinished ] = useState( false );

	const { style: motionInlineStyles, ...otherMotionProps } = useMemo(
		() => placementToMotionAnimationProps( computedPlacement ),
		[ computedPlacement ]
	);

	const animationProps: HTMLMotionProps< 'div' > = shouldAnimate
		? {
				style: {
					...contentStyle,
					...motionInlineStyles,
					...style,
				},
				onAnimationComplete: () => setAnimationFinished( true ),
				...otherMotionProps,
		  }
		: {
				animate: false,
				style: {
					...contentStyle,
					...style,
				},
		  };

	// When Floating UI has finished positioning and Framer Motion has finished animating
	// the popover, add the `is-positioned` class to signal that all transitions have finished.
	const isPositioned =
		( ! shouldAnimate || animationFinished ) && x !== null && y !== null;

	let content = (
		<motion.div
			className={ clsx( className, {
				'is-expanded': isExpanded,
				'is-positioned': isPositioned,
				// Use the 'alternate' classname for 'toolbar' variant for back compat.
				[ `is-${
					computedVariant === 'toolbar'
						? 'alternate'
						: computedVariant
				}` ]: computedVariant,
			} ) }
			{ ...animationProps }
			{ ...contentProps }
			ref={ mergedFloatingRef }
			{ ...dialogProps }
			tabIndex={ -1 }
		>
			{ /* Prevents scroll on the document */ }
			{ isExpanded && <ScrollLock /> }
			{ isExpanded && (
				<div className="components-popover__header">
					<span className="components-popover__header-title">
						{ headerTitle }
					</span>
					<Button
						className="components-popover__close"
						size="small"
						icon={ close }
						onClick={ onClose }
						label={ __( 'Close' ) }
					/>
				</div>
			) }
			<div className="components-popover__content">{ children }</div>
			{ hasArrow && (
				<div
					ref={ arrowCallbackRef }
					className={ [
						'components-popover__arrow',
						`is-${ computedPlacement.split( '-' )[ 0 ] }`,
					].join( ' ' ) }
					style={ {
						left:
							typeof arrowData?.x !== 'undefined' &&
							Number.isFinite( arrowData.x )
								? `${ arrowData.x }px`
								: '',
						top:
							typeof arrowData?.y !== 'undefined' &&
							Number.isFinite( arrowData.y )
								? `${ arrowData.y }px`
								: '',
					} }
				>
					<ArrowTriangle />
				</div>
			) }
		</motion.div>
	);

	const shouldRenderWithinSlot = slot.ref && ! inline;
	const hasAnchor = anchorRef || anchorRect || anchor;

	if ( shouldRenderWithinSlot ) {
		content = <Fill name={ slotName }>{ content }</Fill>;
	} else if ( ! inline ) {
		content = createPortal(
			<StyleProvider document={ document }>{ content }</StyleProvider>,
			getPopoverFallbackContainer()
		);
	}

	if ( hasAnchor ) {
		return content;
	}

	return (
		<>
			<span ref={ anchorRefFallback } />
			{ content }
		</>
	);
};

// Export the PopoverSlot individually to allow typescript to pick the types up.
export const PopoverSlot = forwardRef< HTMLDivElement, PopoverSlotProps >(
	( { name = SLOT_NAME }, ref ) => {
		return (
			<Slot
				bubblesVirtually
				name={ name }
				className="popover-slot"
				ref={ ref }
			/>
		);
	}
);

/**
 * `Popover` renders its content in a floating modal. If no explicit anchor is passed via props, it anchors to its parent element by default.
 *
 * ```jsx
 * import { Button, Popover } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyPopover = () => {
 * 	const [ isVisible, setIsVisible ] = useState( false );
 * 	const toggleVisible = () => {
 * 		setIsVisible( ( state ) => ! state );
 * 	};
 *
 * 	return (
 * 		<Button variant="secondary" onClick={ toggleVisible }>
 * 			Toggle Popover!
 * 			{ isVisible && <Popover>Popover is toggled!</Popover> }
 * 		</Button>
 * 	);
 * };
 * ```
 *
 */
export const Popover = Object.assign(
	contextConnect( UnforwardedPopover, 'Popover' ),
	{
		/**
		 * Renders a slot that is used internally by Popover for rendering content.
		 */
		Slot: Object.assign( PopoverSlot, {
			displayName: 'Popover.Slot',
		} ),
		/**
		 * Provides a context to manage popover slot names.
		 *
		 * This is marked as unstable and should not be used directly.
		 */
		__unstableSlotNameProvider: Object.assign( slotNameContext.Provider, {
			displayName: 'Popover.__unstableSlotNameProvider',
		} ),
	}
);

export default Popover;
