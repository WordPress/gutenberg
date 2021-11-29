/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useRef,
	useMemo,
	createContext,
	useContext,
} from '@wordpress/element';
import { Popover, __unstableMotion as motion } from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { usePopoverScroll } from './use-popover-scroll';

export const InsertionPointOpenRef = createContext();

function InsertionPointPopover( {
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const { selectBlock, hideInsertionPoint } = useDispatch( blockEditorStore );
	const openRef = useContext( InsertionPointOpenRef );
	const ref = useRef();
	const {
		orientation,
		previousClientId,
		nextClientId,
		rootClientId,
		isInserterShown,
	} = useSelect( ( select ) => {
		const {
			getBlockOrder,
			getBlockListSettings,
			getBlockInsertionPoint,
			isBlockBeingDragged,
			getPreviousBlockClientId,
			getNextBlockClientId,
		} = select( blockEditorStore );
		const insertionPoint = getBlockInsertionPoint();
		const order = getBlockOrder( insertionPoint.rootClientId );

		if ( ! order.length ) {
			return {};
		}

		let _previousClientId = order[ insertionPoint.index - 1 ];
		let _nextClientId = order[ insertionPoint.index ];

		while ( isBlockBeingDragged( _previousClientId ) ) {
			_previousClientId = getPreviousBlockClientId( _previousClientId );
		}

		while ( isBlockBeingDragged( _nextClientId ) ) {
			_nextClientId = getNextBlockClientId( _nextClientId );
		}

		return {
			previousClientId: _previousClientId,
			nextClientId: _nextClientId,
			orientation:
				getBlockListSettings( insertionPoint.rootClientId )
					?.orientation || 'vertical',
			rootClientId: insertionPoint.rootClientId,
			isInserterShown: insertionPoint?.__unstableWithInserter,
		};
	}, [] );
	const previousElement = useBlockElement( previousClientId );
	const nextElement = useBlockElement( nextClientId );
	const isVertical = orientation === 'vertical';
	const style = useMemo( () => {
		if ( ! previousElement && ! nextElement ) {
			return {};
		}

		const previousRect = previousElement
			? previousElement.getBoundingClientRect()
			: null;
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( isVertical ) {
			return {
				width: previousElement
					? previousElement.offsetWidth
					: nextElement.offsetWidth,
				height:
					nextRect && previousRect
						? nextRect.top - previousRect.bottom
						: 0,
			};
		}

		let width = 0;
		if ( previousRect && nextRect ) {
			width = isRTL()
				? previousRect.left - nextRect.right
				: nextRect.left - previousRect.right;
		}

		return {
			width,
			height: previousElement
				? previousElement.offsetHeight
				: nextElement.offsetHeight,
		};
	}, [ previousElement, nextElement ] );

	const getAnchorRect = useCallback( () => {
		if ( ! previousElement && ! nextElement ) {
			return {};
		}

		const { ownerDocument } = previousElement || nextElement;

		const previousRect = previousElement
			? previousElement.getBoundingClientRect()
			: null;
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( isVertical ) {
			if ( isRTL() ) {
				return {
					top: previousRect ? previousRect.bottom : nextRect.top,
					left: previousRect ? previousRect.right : nextRect.right,
					right: previousRect ? previousRect.left : nextRect.left,
					bottom: nextRect ? nextRect.top : previousRect.bottom,
					ownerDocument,
				};
			}

			return {
				top: previousRect ? previousRect.bottom : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.left,
				right: previousRect ? previousRect.right : nextRect.right,
				bottom: nextRect ? nextRect.top : previousRect.bottom,
				ownerDocument,
			};
		}

		if ( isRTL() ) {
			return {
				top: previousRect ? previousRect.top : nextRect.top,
				left: previousRect ? previousRect.left : nextRect.right,
				right: nextRect ? nextRect.right : previousRect.left,
				bottom: previousRect ? previousRect.bottom : nextRect.bottom,
				ownerDocument,
			};
		}

		return {
			top: previousRect ? previousRect.top : nextRect.top,
			left: previousRect ? previousRect.right : nextRect.left,
			right: nextRect ? nextRect.left : previousRect.right,
			bottom: previousRect ? previousRect.bottom : nextRect.bottom,
			ownerDocument,
		};
	}, [ previousElement, nextElement ] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );
	const disableMotion = useReducedMotion();

	const className = classnames(
		'block-editor-block-list__insertion-point',
		'is-' + orientation
	);

	function onClick( event ) {
		if ( event.target === ref.current && nextClientId ) {
			selectBlock( nextClientId, -1 );
		}
	}

	function onFocus( event ) {
		// Only handle click on the wrapper specifically, and not an event
		// bubbled from the inserter itself.
		if ( event.target !== ref.current ) {
			openRef.current = true;
		}
	}

	function maybeHideInserterPoint( event ) {
		// Only hide the inserter if it's triggered on the wrapper,
		// and the inserter is not open.
		if ( event.target === ref.current && ! openRef.current ) {
			hideInsertionPoint();
		}
	}

	// Only show the in-between inserter between blocks, so when there's a
	// previous and a next element.
	const showInsertionPointInserter =
		previousElement && nextElement && isInserterShown;

	// Define animation variants for the line element.
	const horizontalLine = {
		start: {
			width: 0,
			top: '50%',
			bottom: '50%',
			x: 0,
		},
		rest: {
			width: 4,
			top: 0,
			bottom: 0,
			x: -2,
		},
		hover: {
			width: 4,
			top: 0,
			bottom: 0,
			x: -2,
		},
	};
	const verticalLine = {
		start: {
			height: 0,
			left: '50%',
			right: '50%',
			y: 0,
		},
		rest: {
			height: 4,
			left: 0,
			right: 0,
			y: -2,
		},
		hover: {
			height: 4,
			left: 0,
			right: 0,
			y: -2,
		},
	};
	const lineVariants = {
		// Initial position starts from the center and invisible.
		start: {
			...( ! isVertical ? horizontalLine.start : verticalLine.start ),
			opacity: 0,
		},
		// The line expands to fill the container. If the inserter is visible it
		// is delayed so it appears orchestrated.
		rest: {
			...( ! isVertical ? horizontalLine.rest : verticalLine.rest ),
			opacity: 1,
			borderRadius: '2px',
			transition: { delay: showInsertionPointInserter ? 0.4 : 0 },
		},
		hover: {
			...( ! isVertical ? horizontalLine.hover : verticalLine.hover ),
			opacity: 1,
			borderRadius: '2px',
			transition: { delay: 0.4 },
		},
	};

	const inserterVariants = {
		start: {
			scale: disableMotion ? 1 : 0,
		},
		rest: {
			scale: 1,
			transition: { delay: 0.2 },
		},
	};

	/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
	// While ideally it would be enough to capture the
	// bubbling focus event from the Inserter, due to the
	// characteristics of click focusing of `button`s in
	// Firefox and Safari, it is not reliable.
	//
	// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
	return (
		<Popover
			ref={ popoverScrollRef }
			noArrow
			animate={ false }
			getAnchorRect={ getAnchorRect }
			focusOnMount={ false }
			className="block-editor-block-list__insertion-point-popover"
			// Render in the old slot if needed for backward compatibility,
			// otherwise render in place (not in the the default popover slot).
			__unstableSlotName={ __unstablePopoverSlot || null }
			// Forces a remount of the popover when its position changes
			// This makes sure the popover doesn't animate from its previous position.
			key={ nextClientId + '--' + rootClientId }
		>
			<motion.div
				layout={ ! disableMotion }
				initial={ disableMotion ? 'rest' : 'start' }
				animate="rest"
				whileHover="hover"
				whileTap="pressed"
				exit="start"
				ref={ ref }
				tabIndex={ -1 }
				onClick={ onClick }
				onFocus={ onFocus }
				className={ classnames( className, {
					'is-with-inserter': showInsertionPointInserter,
				} ) }
				onHoverEnd={ maybeHideInserterPoint }
				style={ style }
			>
				<motion.div
					variants={ lineVariants }
					className="block-editor-block-list__insertion-point-indicator"
				/>
				{ showInsertionPointInserter && (
					<motion.div
						variants={ inserterVariants }
						className={ classnames(
							'block-editor-block-list__insertion-point-inserter'
						) }
					>
						<Inserter
							position="bottom center"
							clientId={ nextClientId }
							rootClientId={ rootClientId }
							__experimentalIsQuick
							onToggle={ ( isOpen ) => {
								openRef.current = isOpen;
							} }
							onSelectOrClose={ () => {
								openRef.current = false;
							} }
						/>
					</motion.div>
				) }
			</motion.div>
		</Popover>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
}

export default function InsertionPoint( {
	children,
	__unstablePopoverSlot,
	__unstableContentRef,
} ) {
	const isVisible = useSelect( ( select ) => {
		return select( blockEditorStore ).isBlockInsertionPointVisible();
	}, [] );

	return (
		<InsertionPointOpenRef.Provider value={ useRef( false ) }>
			{ isVisible && (
				<InsertionPointPopover
					__unstablePopoverSlot={ __unstablePopoverSlot }
					__unstableContentRef={ __unstableContentRef }
				/>
			) }
			{ children }
		</InsertionPointOpenRef.Provider>
	);
}
