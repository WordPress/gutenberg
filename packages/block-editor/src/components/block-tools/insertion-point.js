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
import { Popover } from '@wordpress/components';
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
	const { selectBlock } = useDispatch( blockEditorStore );
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
	const style = useMemo( () => {
		if ( ! previousElement ) {
			return {};
		}
		const previousRect = previousElement.getBoundingClientRect();
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;

		if ( orientation === 'vertical' ) {
			return {
				width: previousElement.offsetWidth,
				height: nextRect ? nextRect.top - previousRect.bottom : 0,
			};
		}

		let width = 0;
		if ( nextElement ) {
			width = isRTL()
				? previousRect.left - nextRect.right
				: nextRect.left - previousRect.right;
		}

		return {
			width,
			height: previousElement.offsetHeight,
		};
	}, [ previousElement, nextElement ] );

	const getAnchorRect = useCallback( () => {
		const { ownerDocument } = previousElement;
		const previousRect = previousElement.getBoundingClientRect();
		const nextRect = nextElement
			? nextElement.getBoundingClientRect()
			: null;
		if ( orientation === 'vertical' ) {
			if ( isRTL() ) {
				return {
					top: previousRect.bottom,
					left: previousRect.right,
					right: previousRect.left,
					bottom: nextRect ? nextRect.top : previousRect.bottom,
					ownerDocument,
				};
			}

			return {
				top: previousRect.bottom,
				left: previousRect.left,
				right: previousRect.right,
				bottom: nextRect ? nextRect.top : previousRect.bottom,
				ownerDocument,
			};
		}

		if ( isRTL() ) {
			return {
				top: previousRect.top,
				left: nextRect ? nextRect.right : previousRect.left,
				right: previousRect.left,
				bottom: previousRect.bottom,
				ownerDocument,
			};
		}

		return {
			top: previousRect.top,
			left: previousRect.right,
			right: nextRect ? nextRect.left : previousRect.right,
			bottom: previousRect.bottom,
			ownerDocument,
		};
	}, [ previousElement, nextElement ] );

	const popoverScrollRef = usePopoverScroll( __unstableContentRef );

	if ( ! previousElement ) {
		return null;
	}

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

	// Only show the inserter when there's a `nextElement` (a block after the
	// insertion point). At the end of the block list the trailing appender
	// should serve the purpose of inserting blocks.
	const showInsertionPointInserter = nextElement && isInserterShown;

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
		>
			<div
				ref={ ref }
				tabIndex={ -1 }
				onClick={ onClick }
				onFocus={ onFocus }
				className={ classnames( className, {
					'is-with-inserter': showInsertionPointInserter,
				} ) }
				style={ style }
			>
				<div className="block-editor-block-list__insertion-point-indicator" />
				{ showInsertionPointInserter && (
					<div
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
					</div>
				) }
			</div>
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
