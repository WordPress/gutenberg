// @ts-nocheck
/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	useFloating,
	flip,
	shift,
	autoUpdate,
	arrow,
	offset as offsetMiddleware,
	limitShift,
	size,
} from '@floating-ui/react-dom';

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
} from '@wordpress/element';
import {
	useViewportMatch,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';
import { getAnimateClassName } from '../animate';

/**
 * Name of slot in which popover should fill.
 *
 * @type {string}
 */
const SLOT_NAME = 'Popover';

const slotNameContext = createContext();

const positionToPlacement = ( position ) => {
	const [ x, y, z ] = position.split( ' ' );

	if ( [ 'top', 'bottom' ].includes( x ) ) {
		let suffix = '';
		if ( ( !! z && z === 'left' ) || y === 'right' ) {
			suffix = '-start';
		} else if ( ( !! z && z === 'right' ) || y === 'left' ) {
			suffix = '-end';
		}
		return x + suffix;
	}

	return y;
};

const placementToAnimationOrigin = ( placement ) => {
	const [ a, b ] = placement.split( '-' );

	let x, y;
	if ( a === 'top' || a === 'bottom' ) {
		x = a === 'top' ? 'bottom' : 'top';
		y = 'middle';
		if ( b === 'start' ) {
			y = 'left';
		} else if ( b === 'end' ) {
			y = 'right';
		}
	}

	if ( a === 'left' || a === 'right' ) {
		x = 'center';
		y = a === 'left' ? 'right' : 'left';
		if ( b === 'start' ) {
			x = 'top';
		} else if ( b === 'end' ) {
			x = 'bottom';
		}
	}

	return x + ' ' + y;
};

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
		placement = 'bottom-start',
		offset,
		focusOnMount = 'firstElement',
		anchorRef,
		anchorRect,
		getAnchorRect,
		expandOnMobile,
		onFocusOutside,
		__unstableSlotName = SLOT_NAME,
		__unstableObserveElement,
		__unstableForcePosition,
		__unstableShift = false,
		...contentProps
	},
	ref
) => {
	if ( range ) {
		deprecated( 'range prop in Popover component', {
			since: '6.1',
			version: '6.3',
		} );
	}

	const arrowRef = useRef( null );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isExpanded = expandOnMobile && isMobileViewport;
	const hasArrow = ! isExpanded && ! noArrow;
	const usedPlacement = position
		? positionToPlacement( position )
		: placement;

	const ownerDocument = useMemo( () => {
		if ( anchorRef?.top ) {
			return anchorRef?.top.ownerDocument;
		} else if ( anchorRef?.startContainer ) {
			return anchorRef.startContainer.ownerDocument;
		} else if ( anchorRef?.current ) {
			return anchorRef.current.ownerDocument;
		} else if ( anchorRef ) {
			// This one should be deprecated.
			return anchorRef.ownerDocument;
		} else if ( anchorRect && anchorRect?.ownerDocument ) {
			return anchorRect.ownerDocument;
		} else if ( getAnchorRect ) {
			return getAnchorRect()?.ownerDocument ?? document;
		}

		return document;
	}, [ anchorRef, anchorRect, getAnchorRect ] );

	/**
	 * Offsets the the position of the popover when the anchor is inside an iframe.
	 */
	const frameOffset = useMemo( () => {
		const { defaultView } = ownerDocument;
		const { frameElement } = defaultView;

		if ( ! frameElement || ownerDocument === document ) {
			return undefined;
		}

		const iframeRect = frameElement.getBoundingClientRect();
		return {
			name: 'iframeOffset',
			fn( { x, y } ) {
				return {
					x: x + iframeRect.left,
					y: y + iframeRect.top,
				};
			},
		};
	}, [ ownerDocument ] );

	const middlewares = [
		frameOffset,
		offset ? offsetMiddleware( offset ) : undefined,
		__unstableForcePosition ? undefined : flip(),
		__unstableForcePosition
			? undefined
			: size( {
					apply( sizeProps ) {
						const { height } = sizeProps;
						if ( ! refs.floating.current ) return;
						// Reduce the height of the popover to the available space.
						Object.assign( refs.floating.current.firstChild.style, {
							maxHeight: `${ height }px`,
							overflow: 'auto',
						} );
					},
			  } ),
		__unstableShift
			? shift( {
					crossAxis: true,
					limiter: limitShift(),
					padding: 1, // Necessary to avoid flickering at the edge of the viewport.
			  } )
			: undefined,
		hasArrow ? arrow( { element: arrowRef } ) : undefined,
	].filter( ( m ) => !! m );
	const anchorRefFallback = useRef( null );
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );

	const onDialogClose = ( type, event ) => {
		// Ideally the popover should have just a single onClose prop and
		// not three props that potentially do the same thing.
		if ( type === 'focus-outside' && onFocusOutside ) {
			onFocusOutside( event );
		} else if ( onClose ) {
			onClose();
		}
	};

	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount,
		__unstableOnClose: onDialogClose,
		onClose: onDialogClose,
	} );

	const {
		x,
		y,
		reference,
		floating,
		strategy,
		refs,
		update,
		placement: placementData,
		middlewareData: { arrow: arrowData = {} },
	} = useFloating( {
		placement: usedPlacement,
		middleware: middlewares,
	} );
	const staticSide = {
		top: 'bottom',
		right: 'left',
		bottom: 'top',
		left: 'right',
	}[ placementData.split( '-' )[ 0 ] ];
	const mergedRefs = useMergeRefs( [ floating, dialogRef, ref ] );

	// Updates references
	useLayoutEffect( () => {
		// No ref or position have been passed
		let usedRef;
		if ( anchorRef?.top ) {
			usedRef = {
				getBoundingClientRect() {
					const topRect = anchorRef.top.getBoundingClientRect();
					const bottomRect = anchorRef.bottom.getBoundingClientRect();
					return new window.DOMRect(
						topRect.x,
						topRect.y,
						topRect.width,
						bottomRect.bottom - topRect.top
					);
				},
			};
		} else if ( anchorRef?.current ) {
			usedRef = anchorRef.current;
		} else if ( anchorRef ) {
			usedRef = anchorRef;
		} else if ( anchorRect ) {
			usedRef = {
				getBoundingClientRect() {
					return anchorRect;
				},
			};
		} else if ( getAnchorRect ) {
			usedRef = {
				getBoundingClientRect() {
					const rect = getAnchorRect();
					return new window.DOMRect(
						rect.x ?? rect.left,
						rect.y ?? rect.top,
						rect.width ?? rect.right - rect.left,
						rect.height ?? rect.bottom - rect.top
					);
				},
			};
		} else if ( anchorRefFallback.current ) {
			usedRef = anchorRefFallback.current;
		}

		if ( ! usedRef ) {
			return;
		}

		reference( usedRef );

		if ( ! refs.floating.current ) {
			return;
		}

		return autoUpdate( usedRef, refs.floating.current, update );
	}, [ anchorRef, anchorRect, getAnchorRect ] );

	// This is only needed for a smoth transition when moving blocks.
	useLayoutEffect( () => {
		if ( ! __unstableObserveElement ) {
			return;
		}
		const observer = new window.MutationObserver( update );
		observer.observe( __unstableObserveElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ __unstableObserveElement ] );

	// If we're using getAnchorRect, we need to update the position as we scroll the iframe.
	useLayoutEffect( () => {
		if ( ownerDocument === document ) {
			return;
		}

		ownerDocument.addEventListener( 'scroll', update );
		return () => ownerDocument.removeEventListener( 'scroll', update );
	}, [ ownerDocument ] );

	/** @type {false | string} */
	const animateClassName =
		!! animate &&
		getAnimateClassName( {
			type: 'appear',
			origin: placementToAnimationOrigin( placementData ),
		} );

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames(
				'components-popover',
				className,
				animateClassName,
				{
					'is-expanded': isExpanded,
					'is-alternate': isAlternate,
				}
			) }
			{ ...contentProps }
			ref={ mergedRefs }
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
					className="components-popover__arrow"
					ref={ arrowRef }
					style={ {
						left:
							! arrowData?.x || Number.isNaN( arrowData?.x )
								? 0
								: arrowData.x,
						top:
							! arrowData?.y || Number.isNaN( arrowData?.y )
								? 0
								: arrowData.y,
						right: undefined,
						bottom: undefined,
						[ staticSide ]: '-4px',
					} }
				/>
			) }
		</div>
	);

	if ( slot.ref ) {
		content = <Fill name={ slotName }>{ content }</Fill>;
	}

	if ( anchorRef || anchorRect ) {
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
