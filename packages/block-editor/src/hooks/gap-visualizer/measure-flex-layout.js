import {
	getContainerScale,
	isChildInFlow,
	getNormalizedChildBox,
} from './measure-utils';

/**
 * @typedef {Object} BoxBounds
 * @property {number} left        Left margin-box coordinate.
 * @property {number} top         Top margin-box coordinate.
 * @property {number} right       Right margin-box coordinate.
 * @property {number} bottom      Bottom margin-box coordinate.
 * @property {Object} [borderBox] Child border-box dimensions.
 */

/**
 * @typedef {Object} FlexLayoutConfig
 * @property {number}  columnGap      Column gap in pixels.
 * @property {number}  rowGap         Row gap in pixels.
 * @property {string}  direction      Flex direction ('row' or 'column').
 * @property {string}  flexWrap       Flex wrap mode.
 * @property {boolean} isSpaceBetween Whether justify-content is space-between.
 * @property {boolean} isRtl          Whether direction is RTL.
 * @property {Object}  contentBox     Container content-box dimensions.
 */

/**
 * @typedef {Object} MeasureFlexResult
 * @property {Array<BoxBounds>} boxes  Measured child boxes.
 * @property {FlexLayoutConfig} config Extracted layout configuration.
 */

/**
 * Measures a flex container and its in-flow children.
 *
 * @param {HTMLElement} containerElement               The flex container DOM element.
 * @param {HTMLElement} [rootElement=containerElement] The root block element.
 *
 * @return {MeasureFlexResult} Measured boxes and configuration.
 */
export function measureFlexLayout(
	containerElement,
	rootElement = containerElement
) {
	if ( ! containerElement ) {
		return {
			boxes: [],
			config: {
				columnGap: 0,
				rowGap: 0,
				direction: 'row',
				flexWrap: 'nowrap',
				isSpaceBetween: false,
				isRtl: false,
				contentBox: { left: 0, top: 0, width: 0, height: 0 },
			},
		};
	}

	const ownerDocument = rootElement.ownerDocument || document;
	const defaultView = ownerDocument.defaultView || window;
	const containerRect = rootElement.getBoundingClientRect();
	const containerComputedStyle =
		defaultView.getComputedStyle( containerElement );

	const scale = getContainerScale( rootElement, containerRect );

	const padding = {
		top: parseFloat( containerComputedStyle.paddingTop ) || 0,
		right: parseFloat( containerComputedStyle.paddingRight ) || 0,
		bottom: parseFloat( containerComputedStyle.paddingBottom ) || 0,
		left: parseFloat( containerComputedStyle.paddingLeft ) || 0,
	};

	const clientLeft = containerElement.clientLeft || 0;
	const clientTop = containerElement.clientTop || 0;

	const columnGap = parseFloat( containerComputedStyle.columnGap ) || 0;
	const rowGap = parseFloat( containerComputedStyle.rowGap ) || 0;
	const direction = containerComputedStyle.flexDirection?.includes( 'column' )
		? 'column'
		: 'row';
	const flexWrap = containerComputedStyle.flexWrap || 'nowrap';
	const isSpaceBetween =
		containerComputedStyle.justifyContent === 'space-between';
	const isRtl = containerComputedStyle.direction === 'rtl';

	const elementRect =
		containerElement === rootElement
			? containerRect
			: containerElement.getBoundingClientRect();
	const offsetLeft = ( elementRect.left - containerRect.left ) / scale;
	const offsetTop = ( elementRect.top - containerRect.top ) / scale;

	const contentBox = {
		left: offsetLeft + clientLeft + padding.left,
		top: offsetTop + clientTop + padding.top,
		width: containerElement.clientWidth - padding.left - padding.right,
		height: containerElement.clientHeight - padding.top - padding.bottom,
	};

	const boxes = [];
	for ( const child of containerElement.children ) {
		const childStyle = defaultView.getComputedStyle( child );

		if ( ! isChildInFlow( childStyle ) ) {
			continue;
		}

		const borderBox = getNormalizedChildBox( child, containerRect, scale );
		if ( ! borderBox ) {
			continue;
		}

		const childMargins = {
			top: parseFloat( childStyle.marginTop ) || 0,
			right: parseFloat( childStyle.marginRight ) || 0,
			bottom: parseFloat( childStyle.marginBottom ) || 0,
			left: parseFloat( childStyle.marginLeft ) || 0,
		};

		boxes.push( {
			left: borderBox.left - childMargins.left,
			top: borderBox.top - childMargins.top,
			right: borderBox.right + childMargins.right,
			bottom: borderBox.bottom + childMargins.bottom,
			borderBox,
		} );
	}

	return {
		boxes,
		config: {
			columnGap,
			rowGap,
			direction,
			flexWrap,
			isSpaceBetween,
			isRtl,
			contentBox,
		},
	};
}
