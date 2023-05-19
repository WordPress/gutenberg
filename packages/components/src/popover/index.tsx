/**
 * External dependencies
 */
import type { ForwardedRef, SyntheticEvent, RefCallback } from 'react';
import classnames from 'classnames';
import {
	useFloating,
	flip as flipMiddleware,
	shift as shiftMiddleware,
	autoUpdate,
	arrow,
	offset as offsetMiddleware,
	size,
	Middleware,
	MiddlewareArguments,
} from '@floating-ui/react-dom';
// eslint-disable-next-line no-restricted-imports
import {
	motion,
	useReducedMotion,
	HTMLMotionProps,
	MotionProps,
} from 'framer-motion';

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
} from '@wordpress/element';
import {
	useViewportMatch,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';
import { Path, SVG } from '@wordpress/primitives';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';
import {
	getFrameOffset,
	getFrameScale,
	positionToPlacement,
	placementToMotionAnimationProps,
	getReferenceOwnerDocument,
	getReferenceElement,
} from './utils';
import type { WordPressComponentProps } from '../ui/context';
import type {
	PopoverProps,
	AnimatedWrapperProps,
	PopoverAnchorRefReference,
	PopoverAnchorRefTopBottom,
} from './types';
import { limitShift as customLimitShift } from './limit-shift';
import { overlayMiddlewares } from './overlay-middlewares';

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'Popover';

// An SVG displaying a triangle facing down, filled with a solid
// color and bordered in such a way to create an arrow-like effect.
// Keeping the SVG's viewbox squared simplify the arrow positioning
// calculations.
const ArrowTriangle = () => (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox={ `0 0 100 100` }
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

const AnimatedWrapper = forwardRef(
	(
		{
			style: receivedInlineStyles,
			placement,
			shouldAnimate = false,
			...props
		}: HTMLMotionProps< 'div' > & AnimatedWrapperProps,
		forwardedRef: ForwardedRef< any >
	) => {
		const shouldReduceMotion = useReducedMotion();

		const { style: motionInlineStyles, ...otherMotionProps } = useMemo(
			() => placementToMotionAnimationProps( placement ),
			[ placement ]
		);

		const computedAnimationProps: HTMLMotionProps< 'div' > =
			shouldAnimate && ! shouldReduceMotion
				? {
						style: {
							...motionInlineStyles,
							...receivedInlineStyles,
						},
						...otherMotionProps,
				  }
				: {
						animate: false,
						style: receivedInlineStyles,
				  };

		return (
			<motion.div
				{ ...computedAnimationProps }
				{ ...props }
				ref={ forwardedRef }
			/>
		);
	}
);

const slotNameContext = createContext< string | undefined >( undefined );

const UnforwardedPopover = (
	props: Omit<
		WordPressComponentProps< PopoverProps, 'div', false >,
		// To avoid overlaps between the standard HTML attributes and the props
		// expected by `framer-motion`, omit all framer motion props from popover
		// props (except for `animate` and `children`, which are re-defined in `PopoverProps`).
		keyof Omit< MotionProps, 'animate' | 'children' >
	>,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		animate = true,
		headerTitle,
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
		variant,

		// Deprecated props
		__unstableForcePosition,
		anchorRef,
		anchorRect,
		getAnchorRect,
		isAlternate,

		// Rest
		...contentProps
	} = props;

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
	const [ referenceOwnerDocument, setReferenceOwnerDocument ] = useState<
		Document | undefined
	>();

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

	/**
	 * Offsets the position of the popover when the anchor is inside an iframe.
	 *
	 * Store the offset in a ref, due to constraints with floating-ui:
	 * https://floating-ui.com/docs/react-dom#variables-inside-middleware-functions.
	 */
	const frameOffsetRef = useRef( getFrameOffset( referenceOwnerDocument ) );

	const middleware = [
		...( placementProp === 'overlay' ? overlayMiddlewares() : [] ),
		// Custom middleware which adjusts the popover's position by taking into
		// account the offset of the anchor's iframe (if any) compared to the page.
		{
			name: 'frameOffset',
			fn( { x, y }: MiddlewareArguments ) {
				if ( ! frameOffsetRef.current ) {
					return {
						x,
						y,
					};
				}

				return {
					x: x + frameOffsetRef.current.x,
					y: y + frameOffsetRef.current.y,
					data: {
						// This will be used in the customLimitShift() function.
						amount: frameOffsetRef.current,
					},
				};
			},
		},
		offsetMiddleware( offsetProp ),
		computedFlipProp ? flipMiddleware() : undefined,
		computedResizeProp
			? size( {
					apply( sizeProps ) {
						const { firstElementChild } =
							refs.floating.current ?? {};

						// Only HTMLElement instances have the `style` property.
						if ( ! ( firstElementChild instanceof HTMLElement ) )
							return;

						// Reduce the height of the popover to the available space.
						Object.assign( firstElementChild.style, {
							maxHeight: `${ sizeProps.availableHeight }px`,
							overflow: 'auto',
						} );
					},
			  } )
			: undefined,
		shift
			? shiftMiddleware( {
					crossAxis: true,
					limiter: customLimitShift(),
					padding: 1, // Necessary to avoid flickering at the edge of the viewport.
			  } )
			: undefined,
		arrow( { element: arrowRef } ),
	].filter(
		( m: Middleware | undefined ): m is Middleware => m !== undefined
	);
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );

	let onDialogClose;

	if ( onClose || onFocusOutside ) {
		onDialogClose = ( type: string | undefined, event: SyntheticEvent ) => {
			// Ideally the popover should have just a single onClose prop and
			// not three props that potentially do the same thing.
			if ( type === 'focus-outside' && onFocusOutside ) {
				onFocusOutside( event );
			} else if ( onClose ) {
				onClose();
			}
		};
	}

	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount,
		__unstableOnClose: onDialogClose,
		// @ts-expect-error The __unstableOnClose property needs to be deprecated first (see https://github.com/WordPress/gutenberg/pull/27675)
		onClose: onDialogClose,
	} );

	const {
		// Positioning coordinates
		x,
		y,
		// Callback refs (not regular refs). This allows the position to be updated.
		// when either elements change.
		reference: referenceCallbackRef,
		floating,
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
		const resultingReferenceOwnerDoc = getReferenceOwnerDocument( {
			anchor,
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
			fallbackDocument: document,
		} );
		const scale = getFrameScale( resultingReferenceOwnerDoc );
		const resultingReferenceElement = getReferenceElement( {
			anchor,
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
			scale,
		} );

		referenceCallbackRef( resultingReferenceElement );

		setReferenceOwnerDocument( resultingReferenceOwnerDoc );
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
		referenceCallbackRef,
	] );

	// If the reference element is in a different ownerDocument (e.g. iFrame),
	// we need to manually update the floating's position as the reference's owner
	// document scrolls. Also update the frame offset if the view resizes.
	useLayoutEffect( () => {
		if (
			// Reference and root documents are the same.
			referenceOwnerDocument === document ||
			// Reference and floating are in the same document.
			referenceOwnerDocument === refs.floating.current?.ownerDocument ||
			// The reference's document has no view (i.e. window)
			// or frame element (ie. it's not an iframe).
			! referenceOwnerDocument?.defaultView?.frameElement
		) {
			frameOffsetRef.current = undefined;
			return;
		}

		const { defaultView } = referenceOwnerDocument;
		const { frameElement } = defaultView;

		const scrollContainer = frameElement
			? getScrollContainer( frameElement )
			: null;

		const updateFrameOffset = () => {
			frameOffsetRef.current = getFrameOffset( referenceOwnerDocument );
			update();
		};
		defaultView.addEventListener( 'resize', updateFrameOffset );
		scrollContainer?.addEventListener( 'scroll', updateFrameOffset );

		updateFrameOffset();

		return () => {
			defaultView.removeEventListener( 'resize', updateFrameOffset );
			scrollContainer?.removeEventListener( 'scroll', updateFrameOffset );
		};
	}, [ referenceOwnerDocument, update, refs.floating ] );

	const mergedFloatingRef = useMergeRefs( [
		floating,
		dialogRef,
		forwardedRef,
	] );

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<AnimatedWrapper
			shouldAnimate={ animate && ! isExpanded }
			placement={ computedPlacement }
			className={ classnames( 'components-popover', className, {
				'is-expanded': isExpanded,
				'is-positioned': x !== null && y !== null,
				// Use the 'alternate' classname for 'toolbar' variant for back compat.
				[ `is-${
					computedVariant === 'toolbar'
						? 'alternate'
						: computedVariant
				}` ]: computedVariant,
			} ) }
			{ ...contentProps }
			ref={ mergedFloatingRef }
			{ ...dialogProps }
			tabIndex={ -1 }
			style={
				isExpanded
					? undefined
					: {
							position: strategy,
							top: 0,
							left: 0,
							// `x` and `y` are framer-motion specific props and are shorthands
							// for `translateX` and `translateY`. Currently it is not possible
							// to use `translateX` and `translateY` because those values would
							// be overridden by the return value of the
							// `placementToMotionAnimationProps` function in `AnimatedWrapper`
							x: Math.round( x ?? 0 ) || undefined,
							y: Math.round( y ?? 0 ) || undefined,
					  }
			}
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
						icon={ close }
						onClick={ onClose }
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
								? `${
										arrowData.x +
										( frameOffsetRef.current?.x ?? 0 )
								  }px`
								: '',
						top:
							typeof arrowData?.y !== 'undefined' &&
							Number.isFinite( arrowData.y )
								? `${
										arrowData.y +
										( frameOffsetRef.current?.y ?? 0 )
								  }px`
								: '',
					} }
				>
					<ArrowTriangle />
				</div>
			) }
		</AnimatedWrapper>
	);

	if ( slot.ref ) {
		content = <Fill name={ slotName }>{ content }</Fill>;
	}

	if ( anchorRef || anchorRect || anchor ) {
		return content;
	}

	return <span ref={ anchorRefFallback }>{ content }</span>;
};

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
export const Popover = forwardRef( UnforwardedPopover );

function PopoverSlot(
	{ name = SLOT_NAME }: { name?: string },
	ref: ForwardedRef< any >
) {
	return (
		<Slot
			// @ts-expect-error Need to type `SlotFill`
			bubblesVirtually
			name={ name }
			className="popover-slot"
			ref={ ref }
		/>
	);
}

// @ts-expect-error For Legacy Reasons
Popover.Slot = forwardRef( PopoverSlot );
// @ts-expect-error For Legacy Reasons
Popover.__unstableSlotNameProvider = slotNameContext.Provider;

export default Popover;
