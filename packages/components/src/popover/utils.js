/**
 * WordPress dependencies
 */
import { getScrollContainer } from '@wordpress/dom';

/**
 * Module constants
 */
const HEIGHT_OFFSET = 10; // used by the arrow and a bit of empty space

/**
 * Utility used to compute the popover position over the xAxis
 *
 * @param {Object}  anchorRect  Anchor Rect.
 * @param {Object}  contentSize Content Size.
 * @param {string}  xAxis       Desired xAxis.
 * @param {string}  corner      Desired corner.
 * @param {boolean} sticky      Whether or not to stick the popover to the
 *                              scroll container edge when part of the anchor
 *                              leaves view.
 * @param {string}  chosenYAxis yAxis to be used.
 *
 * @return {Object} Popover xAxis position and constraints.
 */
export function computePopoverXAxisPosition(
	anchorRect,
	contentSize,
	xAxis,
	corner,
	sticky,
	chosenYAxis
) {
	const { width } = contentSize;
	const isRTL = document.documentElement.dir === 'rtl';

	// Correct xAxis for RTL support
	if ( xAxis === 'left' && isRTL ) {
		xAxis = 'right';
	} else if ( xAxis === 'right' && isRTL ) {
		xAxis = 'left';
	}

	if ( corner === 'left' && isRTL ) {
		corner = 'right';
	} else if ( corner === 'right' && isRTL ) {
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
	} else if ( chosenYAxis !== 'middle' ) {
		leftAlignmentX = anchorMidPoint;
	}

	let rightAlignmentX = anchorRect.right;

	if ( corner === 'left' ) {
		rightAlignmentX = anchorRect.left;
	} else if ( chosenYAxis !== 'middle' ) {
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

	if ( ! sticky ) {
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
			contentWidth = chosenWidth !== width ? chosenWidth : null;
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

	return {
		xAxis: chosenXAxis,
		popoverLeft,
		contentWidth,
	};
}

/**
 * Utility used to compute the popover position over the yAxis
 *
 * @param {Object}  anchorRect        Anchor Rect.
 * @param {Object}  contentSize       Content Size.
 * @param {string}  yAxis             Desired yAxis.
 * @param {string}  corner            Desired corner.
 * @param {boolean} sticky            Whether or not to stick the popover to the
 *                                    scroll container edge when part of the
 *                                    anchor leaves view.
 * @param {Element} anchorRef         The anchor element.
 * @param {Element} relativeOffsetTop If applicable, top offset of the relative
 *                                    positioned parent container.
 *
 * @return {Object} Popover xAxis position and constraints.
 */
export function computePopoverYAxisPosition(
	anchorRect,
	contentSize,
	yAxis,
	corner,
	sticky,
	anchorRef,
	relativeOffsetTop
) {
	const { height } = contentSize;

	if ( sticky ) {
		const scrollContainerEl =
			getScrollContainer( anchorRef ) || document.body;
		const scrollRect = scrollContainerEl.getBoundingClientRect();

		if ( anchorRect.top - height <= scrollRect.top ) {
			return {
				yAxis,
				popoverTop: Math.min(
					anchorRect.bottom - relativeOffsetTop,
					scrollRect.top + height - relativeOffsetTop
				),
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

	if ( ! sticky ) {
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
 * Utility used to compute the popover position and the content max width/height
 * for a popover given its anchor rect and its content size.
 *
 * @param {Object}  anchorRect        Anchor Rect.
 * @param {Object}  contentSize       Content Size.
 * @param {string}  position          Position.
 * @param {boolean} sticky            Whether or not to stick the popover to the
 *                                    scroll container edge when part of the
 *                                    anchor leaves view.
 * @param {Element} anchorRef         The anchor element.
 * @param {number}  relativeOffsetTop If applicable, top offset of the relative
 *                                    positioned parent container.
 *
 * @return {Object} Popover position and constraints.
 */
export function computePopoverPosition(
	anchorRect,
	contentSize,
	position = 'top',
	sticky,
	anchorRef,
	relativeOffsetTop
) {
	const [ yAxis, xAxis = 'center', corner ] = position.split( ' ' );

	const yAxisPosition = computePopoverYAxisPosition(
		anchorRect,
		contentSize,
		yAxis,
		corner,
		sticky,
		anchorRef,
		relativeOffsetTop
	);
	const xAxisPosition = computePopoverXAxisPosition(
		anchorRect,
		contentSize,
		xAxis,
		corner,
		sticky,
		yAxisPosition.yAxis
	);

	return {
		...xAxisPosition,
		...yAxisPosition,
	};
}
