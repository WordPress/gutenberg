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
	limitShift,
	size,
	Middleware,
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
	useEffect,
} from '@wordpress/element';
import {
	useViewportMatch,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';
import { Path, SVG } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';
import {
	getFrameOffset,
	positionToPlacement,
	placementToMotionAnimationProps,
	getReferenceOwnerDocument,
	getReferenceElement,
} from './utils';
import type { WordPressComponentProps } from '../ui/context';
import type {
	PopoverProps,
	AnimatedWrapperProps,
	PopoverAnchorRefElement,
	PopoverAnchorRefReference,
	PopoverAnchorRefTopBottom,
	PopoverAnchorRefStartContainer,
} from './types';

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
		// When animating, animate only once (i.e. when the popover is opened), and
		// do not animate on subsequent prop changes (as it conflicts with
		// floating-ui's positioning updates).
		const [ hasAnimatedOnce, setHasAnimatedOnce ] = useState( false );
		const shouldReduceMotion = useReducedMotion();

		const { style: motionInlineStyles, ...otherMotionProps } = useMemo(
			() => placementToMotionAnimationProps( placement ),
			[ placement ]
		);

		const onAnimationComplete = useCallback(
			() => setHasAnimatedOnce( true ),
			[]
		);

		const computedAnimationProps: HTMLMotionProps< 'div' > =
			shouldAnimate && ! shouldReduceMotion
				? {
						style: {
							...motionInlineStyles,
							...receivedInlineStyles,
						},
						...otherMotionProps,
						onAnimationComplete,
						animate: hasAnimatedOnce
							? false
							: otherMotionProps.animate,
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
		// props (except for `animate`, which is re-defined in `PopoverProps`).
		keyof Omit< MotionProps, 'animate' >
	>,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		range,
		animate = true,
		headerTitle,
		onClose,
		children,
		className,
		noArrow = true,
		isAlternate,
		position,
		placement: placementProp = 'bottom-start',
		offset: offsetProp = 0,
		focusOnMount = 'firstElement',
		anchorRef,
		anchorRect,
		getAnchorRect,
		expandOnMobile,
		onFocusOutside,
		__unstableSlotName = SLOT_NAME,
		flip = true,
		resize = true,
		shift = false,
		__unstableShift,
		__unstableForcePosition,
		...contentProps
	} = props;

	if ( range ) {
		deprecated( 'range prop in Popover component', {
			since: '6.1',
			version: '6.3',
		} );
	}

	let computedFlipProp = flip;
	let computedResizeProp = resize;
	if ( __unstableForcePosition !== undefined ) {
		deprecated( '__unstableForcePosition prop in Popover component', {
			since: '6.1',
			version: '6.3',
			alternative: '`flip={ false }` and  `resize={ false }`',
		} );

		// Back-compat, set the `flip` and `resize` props
		// to `false` to replicate `__unstableForcePosition`.
		computedFlipProp = ! __unstableForcePosition;
		computedResizeProp = ! __unstableForcePosition;
	}

	let shouldShift = shift;
	if ( __unstableShift !== undefined ) {
		deprecated( '`__unstableShift` prop in Popover component', {
			since: '6.1',
			version: '6.3',
			alternative: '`shift` prop`',
		} );

		// Back-compat.
		shouldShift = __unstableShift;
	}

	const arrowRef = useRef( null );

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
	/**
	 * Store the offset prop in a ref, due to constraints with floating-ui:
	 * https://floating-ui.com/docs/react-dom#variables-inside-middleware-functions.
	 */
	const offsetRef = useRef( offsetProp );

	const middleware = [
		offsetMiddleware( ( { placement: currentPlacement } ) => {
			if ( ! frameOffsetRef.current ) {
				return offsetRef.current;
			}

			const isTopBottomPlacement =
				currentPlacement.includes( 'top' ) ||
				currentPlacement.includes( 'bottom' );

			// The main axis should represent the gap between the
			// floating element and the reference element. The cross
			// axis is always perpendicular to the main axis.
			const mainAxis = isTopBottomPlacement ? 'y' : 'x';
			const crossAxis = mainAxis === 'x' ? 'y' : 'x';

			// When the popover is before the reference, subtract the offset,
			// of the main axis else add it.
			const hasBeforePlacement =
				currentPlacement.includes( 'top' ) ||
				currentPlacement.includes( 'left' );
			const mainAxisModifier = hasBeforePlacement ? -1 : 1;

			return {
				mainAxis:
					offsetRef.current +
					frameOffsetRef.current[ mainAxis ] * mainAxisModifier,
				crossAxis: frameOffsetRef.current[ crossAxis ],
			};
		} ),
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
		shouldShift
			? shiftMiddleware( {
					crossAxis: true,
					limiter: limitShift(),
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
		onDialogClose = (
			type: 'focus-outside' | undefined,
			event: SyntheticEvent
		) => {
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
		middlewareData: { arrow: arrowData = {} },
	} = useFloating( {
		placement: normalizedPlacementFromProps,
		middleware,
		whileElementsMounted: ( referenceParam, floatingParam, updateParam ) =>
			autoUpdate( referenceParam, floatingParam, updateParam, {
				animationFrame: true,
			} ),
	} );

	useEffect( () => {
		offsetRef.current = offsetProp;
		update();
	}, [ offsetProp, update ] );

	const arrowCallbackRef = useCallback(
		( node ) => {
			arrowRef.current = node;
			update();
		},
		[ update ]
	);

	// When any of the possible anchor "sources" change,
	// recompute the reference element (real or virtual) and its owner document.
	useLayoutEffect( () => {
		const resultingReferenceOwnerDoc = getReferenceOwnerDocument( {
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
			fallbackDocument: document,
		} );
		const resultingReferenceElement = getReferenceElement( {
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
		} );

		referenceCallbackRef( resultingReferenceElement );

		setReferenceOwnerDocument( resultingReferenceOwnerDoc );
	}, [
		anchorRef as PopoverAnchorRefElement | undefined,
		( anchorRef as PopoverAnchorRefTopBottom | undefined )?.top,
		( anchorRef as PopoverAnchorRefTopBottom | undefined )?.bottom,
		( anchorRef as PopoverAnchorRefStartContainer | undefined )
			?.startContainer,
		( anchorRef as PopoverAnchorRefReference )?.current,
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
			// reference and floating are in the same document
			referenceOwnerDocument === document ||
			// the reference's document has a view (i.e. window)
			// and a frame element (ie. it's an iframe)
			! referenceOwnerDocument?.defaultView?.frameElement
		) {
			frameOffsetRef.current = undefined;
			return;
		}

		const { defaultView } = referenceOwnerDocument;

		const updateFrameOffset = () => {
			frameOffsetRef.current = getFrameOffset( referenceOwnerDocument );
			update();
		};
		defaultView.addEventListener( 'resize', updateFrameOffset );

		updateFrameOffset();

		return () => {
			defaultView.removeEventListener( 'resize', updateFrameOffset );
		};
	}, [ referenceOwnerDocument, update ] );

	const mergedFloatingRef = useMergeRefs( [
		floating,
		// @ts-expect-error dialogRef is returned by useDialog and seems correct, but somehow it's not picked up by TypeScript
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
				'is-alternate': isAlternate,
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
							left: Number.isNaN( x ) ? 0 : x,
							top: Number.isNaN( y ) ? 0 : y,
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
						left: Number.isFinite( arrowData?.x )
							? `${
									arrowData.x +
									( frameOffsetRef.current?.x ?? 0 )
							  }px`
							: '',
						top: Number.isFinite( arrowData?.y )
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

	if ( anchorRef || anchorRect ) {
		return content;
	}

	return <span ref={ anchorRefFallback }>{ content }</span>;
};

const Popover = forwardRef( UnforwardedPopover );

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
