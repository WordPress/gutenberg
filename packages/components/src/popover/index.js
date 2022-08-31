// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	useFloating,
	flip as flipMiddleware,
	shift,
	autoUpdate,
	arrow,
	offset as offsetMiddleware,
	limitShift,
	size,
} from '@floating-ui/react-dom';
// eslint-disable-next-line no-restricted-imports
import { motion, useReducedMotion } from 'framer-motion';

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
const ArrowTriangle = ( props ) => (
	<SVG
		{ ...props }
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

const MaybeAnimatedWrapper = forwardRef(
	(
		{
			style: receivedInlineStyles,
			placement,
			shouldAnimate = false,
			...props
		},
		forwardedRef
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

		if ( shouldAnimate && ! shouldReduceMotion ) {
			return (
				<motion.div
					style={ {
						...motionInlineStyles,
						...receivedInlineStyles,
					} }
					{ ...otherMotionProps }
					onAnimationComplete={ onAnimationComplete }
					animate={
						hasAnimatedOnce ? false : otherMotionProps.animate
					}
					{ ...props }
					ref={ forwardedRef }
				/>
			);
		}

		return (
			<div
				style={ receivedInlineStyles }
				{ ...props }
				ref={ forwardedRef }
			/>
		);
	}
);

const slotNameContext = createContext();

const Popover = (
	{
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
		anchor,
		anchorRef,
		anchorRect,
		getAnchorRect,
		expandOnMobile,
		onFocusOutside,
		__unstableSlotName = SLOT_NAME,
		flip = true,
		resize = true,
		__unstableShift = false,
		__unstableForcePosition,
		...contentProps
	},
	forwardedRef
) => {
	if ( range ) {
		deprecated( 'range prop in Popover component', {
			since: '6.1',
			version: '6.3',
		} );
	}

	if ( __unstableForcePosition !== undefined ) {
		deprecated( '__unstableForcePosition prop in Popover component', {
			since: '6.1',
			version: '6.3',
			alternative: '`flip={ false }` and  `resize={ false }`',
		} );

		// Back-compat, set the `flip` and `resize` props
		// to `false` to replicate `__unstableForcePosition`.
		flip = ! __unstableForcePosition;
		resize = ! __unstableForcePosition;
	}

	if ( anchorRef !== undefined ) {
		// deprecated( '`anchorRef` prop in Popover component', {
		// 	since: '6.1',
		// 	version: '6.3',
		// 	alternative: '`anchor` prop',
		// } );
	}

	if ( anchorRect !== undefined ) {
		// deprecated( '`anchorRect` prop in Popover component', {
		// 	since: '6.1',
		// 	version: '6.3',
		// 	alternative: '`anchor` prop',
		// } );
	}

	if ( getAnchorRect !== undefined ) {
		// deprecated( '`getAnchorRect` prop in Popover component', {
		// 	since: '6.1',
		// 	version: '6.3',
		// 	alternative: '`anchor` prop',
		// } );
	}

	const arrowRef = useRef( null );

	const [ referenceElement, setReferenceElement ] = useState();
	const [ fallbackReferenceElement, setFallbackReferenceElement ] =
		useState();
	const [ referenceOwnerDocument, setReferenceOwnerDocument ] = useState();

	const anchorRefFallback = useCallback( ( node ) => {
		setFallbackReferenceElement( node );
	}, [] );

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
		flip ? flipMiddleware() : undefined,
		resize
			? size( {
					apply( sizeProps ) {
						const { availableHeight } = sizeProps;
						if ( ! refs.floating.current ) return;
						// Reduce the height of the popover to the available space.
						Object.assign( refs.floating.current.firstChild.style, {
							maxHeight: `${ availableHeight }px`,
							overflow: 'auto',
						} );
					},
			  } )
			: undefined,
		__unstableShift
			? shift( {
					crossAxis: true,
					limiter: limitShift(),
					padding: 1, // Necessary to avoid flickering at the edge of the viewport.
			  } )
			: undefined,
		arrow( { element: arrowRef } ),
	].filter( ( m ) => !! m );
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );

	let onDialogClose;

	if ( onClose || onFocusOutside ) {
		onDialogClose = ( type, event ) => {
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
			anchor,
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
			fallbackDocument: document,
		} );
		const resultingReferenceElement = getReferenceElement( {
			anchor,
			anchorRef,
			anchorRect,
			getAnchorRect,
			fallbackReferenceElement,
		} );

		referenceCallbackRef( resultingReferenceElement );

		setReferenceElement( resultingReferenceElement );
		setReferenceOwnerDocument( resultingReferenceOwnerDoc );
	}, [
		anchor,
		anchorRef,
		anchorRef?.top,
		anchorRef?.bottom,
		anchorRef?.startContainer,
		anchorRef?.current,
		anchorRect,
		getAnchorRect,
		fallbackReferenceElement,
		referenceCallbackRef,
	] );

	// If the reference element is in a different ownerDocument (e.g. iFrame),
	// we need to manually update the floating's position as the reference's owner
	// document scrolls. Also update the frame offset if the view resizes.
	useLayoutEffect( () => {
		const referenceAndFloatingAreInSameDocument =
			referenceOwnerDocument === document;
		const hasFrameElement =
			!! referenceOwnerDocument?.defaultView?.frameElement;

		if ( referenceAndFloatingAreInSameDocument || ! hasFrameElement ) {
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
		dialogRef,
		forwardedRef,
	] );

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<MaybeAnimatedWrapper
			shouldAnimate={ animate && ! isExpanded }
			placement={ computedPlacement }
			className={ classnames( 'components-popover', className, {
				'is-expanded': isExpanded,
				'is-alternate': isAlternate,
			} ) }
			{ ...contentProps }
			ref={ mergedFloatingRef }
			{ ...dialogProps }
			tabIndex="-1"
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
		</MaybeAnimatedWrapper>
	);

	if ( slot.ref ) {
		content = <Fill name={ slotName }>{ content }</Fill>;
	}

	if ( referenceElement && referenceElement !== fallbackReferenceElement ) {
		return content;
	}

	return <span ref={ anchorRefFallback }>{ content }</span>;
};

const PopoverContainer = forwardRef( Popover );

function PopoverSlot( { name = SLOT_NAME }, ref ) {
	return (
		<Slot
			bubblesVirtually
			name={ name }
			className="popover-slot"
			ref={ ref }
		/>
	);
}

PopoverContainer.Slot = forwardRef( PopoverSlot );
PopoverContainer.__unstableSlotNameProvider = slotNameContext.Provider;

export default PopoverContainer;
