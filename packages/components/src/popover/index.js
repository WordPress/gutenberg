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
} from '@wordpress/element';
import {
	useViewportMatch,
	useResizeObserver,
	useMergeRefs,
	__experimentalUseDialog as useDialog,
} from '@wordpress/compose';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import ScrollLock from '../scroll-lock';
import { Slot, Fill, useSlot } from '../slot-fill';

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

const Popover = (
	{
		// Disable reason: We generate the `...contentProps` rest as remainder
		// of props which aren't explicitly handled by this component.
		/* eslint-disable no-unused-vars */
		range,
		animate,
		/* eslint-enable no-unused-vars */
		headerTitle,
		onClose,
		children,
		className,
		noArrow = true,
		isAlternate,
		position,
		placement = 'bottom-start',
		focusOnMount = 'firstElement',
		anchorRef,
		anchorRect,
		getAnchorRect,
		expandOnMobile,
		onFocusOutside,
		__unstableSlotName = SLOT_NAME,
		__unstableObserveElement,
		__unstableForcePosition,
		...contentProps
	},
	ref
) => {
	const arrowRef = useRef( null );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const isExpanded = expandOnMobile && isMobileViewport;
	const hasArrow = ! isExpanded && ! noArrow;
	const usedPlacement = position
		? positionToPlacement( position )
		: placement;
	const middlewares = [
		__unstableForcePosition ? undefined : flip(),
		shift( {
			crossAxis: true,
		} ),
		hasArrow ? arrow( { element: arrowRef } ) : undefined,
	].filter( ( m ) => !! m );
	const anchorRefFallback = useRef( null );
	const slotName = useContext( slotNameContext ) || __unstableSlotName;
	const slot = useSlot( slotName );
	const [ resizeObserver, sizes ] = useResizeObserver();

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
			usedRef = anchorRef.top;
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
					return {
						...rect,
						x: rect.x ?? rect.left,
						y: rect.y ?? rect.top,
						height: rect.height ?? rect.bottom - rect.top,
						width: rect.width ?? rect.right - rect.left,
					};
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

	// Disable reason: We care to capture the _bubbled_ events from inputs
	// within popover as inferring close intent.

	let content = (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ classnames( 'components-popover', className, {
				'is-expanded': isExpanded,
				'is-alternate': isAlternate,
			} ) }
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
			<div className="components-popover__content" style={ sizes }>
				<div style={ { position: 'absolute', minWidth: '100%' } }>
					{ resizeObserver }
					{ children }
				</div>
			</div>
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
