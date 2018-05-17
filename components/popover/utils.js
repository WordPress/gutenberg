const isMobileViewport = () => window.innerWidth < 782;

/**
 * Utilitity used to compute the popover position and the content max width/height for a popover
 * given its anchor rect and its content size.
 *
 * @param {Object} anchorRect       Anchor Rect.
 * @param {Object} contentSize      Content Size.
 * @param {string} position         Position.
 * @param {boolean} expandOnMobile  Whether to expand the popover on mobile or not.
 *
 * @return {Object} Popover position and constraints.
 */
export function computePopoverPosition( anchorRect, contentSize, position = 'top', expandOnMobile = false ) {
	const { width, height } = contentSize;
	const popoverLeft = Math.round( anchorRect.left + ( anchorRect.width / 2 ) );
	const [ yAxis, xAxis = 'center' ] = position.split( ' ' );

	// y axis aligment choices
	const topAlignment = {
		popoverTop: anchorRect.top,
		contentHeight: anchorRect.top - height > 0 ? height : anchorRect.top,
	};
	const bottomAlignment = {
		popoverTop: anchorRect.bottom,
		contentHeight: anchorRect.bottom + height > window.innerHeight ? window.innerHeight - anchorRect.bottom : height,
	};

	// x axis alignment choices
	const centerAlignment = {
		contentWidth: (
			( popoverLeft - ( width / 2 ) > 0 ? ( width / 2 ) : popoverLeft ) +
			( popoverLeft + ( width / 2 ) > window.innerWidth ? window.innerWidth - popoverLeft : ( width / 2 ) )
		),
	};
	const leftAlignment = {
		contentWidth: popoverLeft - width > 0 ? width : popoverLeft,
	};
	const rightAlignment = {
		contentWidth: popoverLeft + width > window.innerWidth ? window.innerWidth - popoverLeft : width,
	};

	// Choosing the y axis
	let chosenYAxis;
	let contentHeight = null;
	if ( yAxis === 'top' && topAlignment.contentHeight === height ) {
		chosenYAxis = 'top';
	} else if ( yAxis === 'bottom' && bottomAlignment.contentHeight === height ) {
		chosenYAxis = 'bottom';
	} else {
		chosenYAxis = topAlignment.contentHeight > bottomAlignment.contentHeight ? 'top' : 'bottom';
		const chosenHeight = chosenYAxis === 'top' ? topAlignment.contentHeight : bottomAlignment.contentHeight;
		contentHeight = chosenHeight !== height ? chosenHeight : null;
	}

	// Choosing the x axis
	let chosenXAxis;
	let contentWidth = null;
	if ( xAxis === 'center' && centerAlignment.contentWidth === width ) {
		chosenXAxis = 'center';
	} else if ( xAxis === 'left' && leftAlignment.contentWidth === width ) {
		chosenXAxis = 'left';
	} else if ( xAxis === 'right' && rightAlignment.contentWidth === width ) {
		chosenXAxis = 'right';
	} else {
		chosenXAxis = leftAlignment.contentWidth > rightAlignment.contentWidth ? 'left' : 'right';
		const chosenWidth = chosenXAxis === 'left' ? leftAlignment.contentWidth : rightAlignment.contentWidth;
		contentWidth = chosenWidth !== width ? chosenWidth : null;
	}

	const popoverTop = chosenYAxis === 'top' ? topAlignment.popoverTop : bottomAlignment.popoverTop;
	return {
		isMobile: isMobileViewport() && expandOnMobile,
		yAxis: chosenYAxis,
		xAxis: chosenXAxis,
		popoverTop,
		popoverLeft,
		contentHeight,
		contentWidth,
	};
}
