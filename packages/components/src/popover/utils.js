// @ts-nocheck
/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';

/**
 * Module constants
 */
const HEIGHT_OFFSET = 10; // used by the arrow and a bit of empty space

/**
 * Utility used to compute the popover position over the xAxis
 *
 * @param {Object}  anchorRect            Anchor Rect.
 * @param {Object}  contentSize           Content Size.
 * @param {string}  xAxis                 Desired xAxis.
 * @param {string}  corner                Desired corner.
 * @param {boolean} stickyBoundaryElement The boundary element to use when
 *                                        switching between sticky and normal
 *                                        position.
 * @param {string}  chosenYAxis           yAxis to be used.
 * @param {Element} boundaryElement       Boundary element.
 * @param {boolean} forcePosition         Don't adjust position based on anchor.
 * @param {boolean} forceXAlignment       Don't adjust alignment based on YAxis
 *
 * @return {Object} Popover xAxis position and constraints.
 */
export function computePopoverXAxisPosition(
	anchorRect,
	contentSize,
	xAxis,
	corner,
	stickyBoundaryElement,
	chosenYAxis,
	boundaryElement,
	forcePosition,
	forceXAlignment
) {
	const { width } = contentSize;

	// Correct xAxis for RTL support
	if ( xAxis === 'left' && isRTL() ) {
		xAxis = 'right';
	} else if ( xAxis === 'right' && isRTL() ) {
		xAxis = 'left';
	}

	if ( corner === 'left' && isRTL() ) {
		corner = 'right';
	} else if ( corner === 'right' && isRTL() ) {
		corner = 'left';
	}

	// x axis alignment choices
	const anchorMidPoint = Math.round( anchorRect.left + anchorRect.width / 2 );
	const centerAlignment = {
		popoverLeft: anchorMidPoint,
		contentWidth:
			( anchorMidPoint - width / 2 > 0 ? width / 2 : anchorMidPoint ) +
			( anchorMidPoint + width / 2 > window.innerWidth
				? window.innerWidth - anchorMidPoint
				: width / 2 ),
	};

	let leftAlignmentX = anchorRect.left;

	if ( corner === 'right' ) {
		leftAlignmentX = anchorRect.right;
	} else if ( chosenYAxis !== 'middle' && ! forceXAlignment ) {
		leftAlignmentX = anchorMidPoint;
	}

	let rightAlignmentX = anchorRect.right;

	if ( corner === 'left' ) {
		rightAlignmentX = anchorRect.left;
	} else if ( chosenYAxis !== 'middle' && ! forceXAlignment ) {
		rightAlignmentX = anchorMidPoint;
	}

	const leftAlignment = {
		popoverLeft: leftAlignmentX,
		contentWidth: leftAlignmentX - width > 0 ? width : leftAlignmentX,
	};
	const rightAlignment = {
		popoverLeft: rightAlignmentX,
		contentWidth:
			rightAlignmentX + width > window.innerWidth
				? window.innerWidth - rightAlignmentX
				: width,
	};

	// Choosing the x axis
	let chosenXAxis = xAxis;
	let contentWidth = null;

	if ( ! stickyBoundaryElement && ! forcePosition ) {
		if ( xAxis === 'center' && centerAlignment.contentWidth === width ) {
			chosenXAxis = 'center';
		} else if ( xAxis === 'left' && leftAlignment.contentWidth === width ) {
			chosenXAxis = 'left';
		} else if (
			xAxis === 'right' &&
			rightAlignment.contentWidth === width
		) {
			chosenXAxis = 'right';
		} else {
			chosenXAxis =
				leftAlignment.contentWidth > rightAlignment.contentWidth
					? 'left'
					: 'right';
			const chosenWidth =
				chosenXAxis === 'left'
					? leftAlignment.contentWidth
					: rightAlignment.contentWidth;

			// Limit width of the content to the viewport width
			if ( width > window.innerWidth ) {
				contentWidth = window.innerWidth;
			}

			// If we can't find any alignment options that could fit
			// our content, then let's fallback to the center of the viewport.
			if ( chosenWidth !== width ) {
				chosenXAxis = 'center';
				centerAlignment.popoverLeft = window.innerWidth / 2;
			}
		}
	}

	let popoverLeft;
	if ( chosenXAxis === 'center' ) {
		popoverLeft = centerAlignment.popoverLeft;
	} else if ( chosenXAxis === 'left' ) {
		popoverLeft = leftAlignment.popoverLeft;
	} else {
		popoverLeft = rightAlignment.popoverLeft;
	}

	if ( boundaryElement ) {
		popoverLeft = Math.min(
			popoverLeft,
			boundaryElement.offsetLeft + boundaryElement.offsetWidth - width
		);

		// Avoid the popover being position beyond the left boundary if the
		// direction is left to right.
		if ( ! isRTL() ) {
			popoverLeft = Math.max( popoverLeft, 0 );
		}
	}

	return {
		xAxis: chosenXAxis,
		popoverLeft,
		contentWidth,
	};
}

/**
 * Utility used to compute the popover position over the yAxis
 *
 * @param {Object}       anchorRect            Anchor Rect.
 * @param {Object}       contentSize           Content Size.
 * @param {string}       yAxis                 Desired yAxis.
 * @param {string}       corner                Desired corner.
 * @param {boolean}      stickyBoundaryElement The boundary element to use when switching between sticky
 *                                             and normal position.
 * @param {Element}      anchorRef             The anchor element.
 * @param {Element}      relativeOffsetTop     If applicable, top offset of the relative positioned
 *                                             parent container.
 * @param {boolean}      forcePosition         Don't adjust position based on anchor.
 * @param {Element|null} editorWrapper         Element that wraps the editor content. Used to access
 *                                             scroll position to determine sticky behavior.
 * @return {Object} Popover xAxis position and constraints.
 */
export function computePopoverYAxisPosition(
	anchorRect,
	contentSize,
	yAxis,
	corner,
	stickyBoundaryElement,
	anchorRef,
	relativeOffsetTop,
	forcePosition,
	editorWrapper
) {
	const { height } = contentSize;

	if ( stickyBoundaryElement ) {
		const stickyRect = stickyBoundaryElement.getBoundingClientRect();
		const stickyPositionTop = stickyRect.top + height - relativeOffsetTop;
		const stickyPositionBottom =
			stickyRect.bottom - height - relativeOffsetTop;

		if ( anchorRect.top <= stickyPositionTop ) {
			if ( editorWrapper ) {
				// If a popover cannot be positioned above the anchor, even after scrolling, we must
				// ensure we use the bottom position instead of the popover slot.  This prevents the
				// popover from always restricting block content and interaction while selected if the
				// block is near the top of the site editor.

				const isRoomAboveInCanvas =
					height + HEIGHT_OFFSET <
					editorWrapper.scrollTop + anchorRect.top;
				if ( ! isRoomAboveInCanvas ) {
					return {
						yAxis: 'bottom',
						// If the bottom of the block is also below the bottom sticky position (ex -
						// block is also taller than the editor window), return the bottom sticky
						// position instead.  We do this instead of the top sticky position both to
						// allow a smooth transition and more importantly to ensure every section of
						// the block can be free from popover obscuration at some point in the
						// scroll position.
						popoverTop: Math.min(
							anchorRect.bottom,
							stickyPositionBottom
						),
					};
				}
			}
			// Default sticky behavior.
			return {
				yAxis,
				popoverTop: Math.min( anchorRect.bottom, stickyPositionTop ),
			};
		}
	}

	// y axis alignment choices
	let anchorMidPoint = anchorRect.top + anchorRect.height / 2;

	if ( corner === 'bottom' ) {
		anchorMidPoint = anchorRect.bottom;
	} else if ( corner === 'top' ) {
		anchorMidPoint = anchorRect.top;
	}

	const middleAlignment = {
		popoverTop: anchorMidPoint,
		contentHeight:
			( anchorMidPoint - height / 2 > 0 ? height / 2 : anchorMidPoint ) +
			( anchorMidPoint + height / 2 > window.innerHeight
				? window.innerHeight - anchorMidPoint
				: height / 2 ),
	};

	const topAlignment = {
		popoverTop: anchorRect.top,
		contentHeight:
			anchorRect.top - HEIGHT_OFFSET - height > 0
				? height
				: anchorRect.top - HEIGHT_OFFSET,
	};
	const bottomAlignment = {
		popoverTop: anchorRect.bottom,
		contentHeight:
			anchorRect.bottom + HEIGHT_OFFSET + height > window.innerHeight
				? window.innerHeight - HEIGHT_OFFSET - anchorRect.bottom
				: height,
	};

	// Choosing the y axis
	let chosenYAxis = yAxis;
	let contentHeight = null;

	if ( ! stickyBoundaryElement && ! forcePosition ) {
		if ( yAxis === 'middle' && middleAlignment.contentHeight === height ) {
			chosenYAxis = 'middle';
		} else if ( yAxis === 'top' && topAlignment.contentHeight === height ) {
			chosenYAxis = 'top';
		} else if (
			yAxis === 'bottom' &&
			bottomAlignment.contentHeight === height
		) {
			chosenYAxis = 'bottom';
		} else {
			chosenYAxis =
				topAlignment.contentHeight > bottomAlignment.contentHeight
					? 'top'
					: 'bottom';
			const chosenHeight =
				chosenYAxis === 'top'
					? topAlignment.contentHeight
					: bottomAlignment.contentHeight;
			contentHeight = chosenHeight !== height ? chosenHeight : null;
		}
	}

	let popoverTop;
	if ( chosenYAxis === 'middle' ) {
		popoverTop = middleAlignment.popoverTop;
	} else if ( chosenYAxis === 'top' ) {
		popoverTop = topAlignment.popoverTop;
	} else {
		popoverTop = bottomAlignment.popoverTop;
	}

	return {
		yAxis: chosenYAxis,
		popoverTop,
		contentHeight,
	};
}

/**
 * Utility used to compute the popover position and the content max width/height for a popover given
 * its anchor rect and its content size.
 *
 * @param {Object}       anchorRect            Anchor Rect.
 * @param {Object}       contentSize           Content Size.
 * @param {string}       position              Position.
 * @param {boolean}      stickyBoundaryElement The boundary element to use when switching between
 *                                             sticky and normal position.
 * @param {Element}      anchorRef             The anchor element.
 * @param {number}       relativeOffsetTop     If applicable, top offset of the relative positioned
 *                                             parent container.
 * @param {Element}      boundaryElement       Boundary element.
 * @param {boolean}      forcePosition         Don't adjust position based on anchor.
 * @param {boolean}      forceXAlignment       Don't adjust alignment based on YAxis
 * @param {Element|null} editorWrapper         Element that wraps the editor content. Used to access
 *                                             scroll position to determine sticky behavior.
 * @return {Object} Popover position and constraints.
 */
export function computePopoverPosition(
	anchorRect,
	contentSize,
	position = 'top',
	stickyBoundaryElement,
	anchorRef,
	relativeOffsetTop,
	boundaryElement,
	forcePosition,
	forceXAlignment,
	editorWrapper
) {
	const [ yAxis, xAxis = 'center', corner ] = position.split( ' ' );

	const yAxisPosition = computePopoverYAxisPosition(
		anchorRect,
		contentSize,
		yAxis,
		corner,
		stickyBoundaryElement,
		anchorRef,
		relativeOffsetTop,
		forcePosition,
		editorWrapper
	);
	const xAxisPosition = computePopoverXAxisPosition(
		anchorRect,
		contentSize,
		xAxis,
		corner,
		stickyBoundaryElement,
		yAxisPosition.yAxis,
		boundaryElement,
		forcePosition,
		forceXAlignment
	);

	return {
		...xAxisPosition,
		...yAxisPosition,
	};
}

/**
 * Offsets the given rect by the position of the iframe that contains the
 * element. If the owner document is not in an iframe then it returns with the
 * original rect. If the popover container document and the anchor document are
 * the same, the original rect will also be returned.
 *
 * @param {DOMRect}  rect          bounds of the element
 * @param {Document} ownerDocument document of the element
 * @param {Element}  container     The popover container to position.
 *
 * @return {DOMRect} offsetted bounds
 */
export function offsetIframe( rect, ownerDocument, container ) {
	const { defaultView } = ownerDocument;
	const { frameElement } = defaultView;

	if ( ! frameElement || ownerDocument === container.ownerDocument ) {
		return rect;
	}

	const iframeRect = frameElement.getBoundingClientRect();
	return new defaultView.DOMRect(
		rect.left + iframeRect.left,
		rect.top + iframeRect.top,
		rect.width,
		rect.height
	);
}
