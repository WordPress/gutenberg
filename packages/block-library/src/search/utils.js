/**
 * Constants
 */
export const PC_WIDTH_DEFAULT = 50;
export const PX_WIDTH_DEFAULT = 350;
export const MIN_WIDTH = 220;
export const MIN_WIDTH_UNIT = 'px';

/**
 * Returns a boolean whether passed unit is percentage
 *
 * @param {string} unit Block width unit.
 *
 * @return {boolean} 	Whether unit is '%'.
 */
export function isPercentageUnit( unit ) {
	return unit === '%';
}

/**
 * Returns the computed styles for the supplied DOM element.
 *
 * @param  {Object} node DOM element
 *
 * @return {Object}      Computed Styles
 */
function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

/**
 * Calculates the available width within search block's parent.
 *
 * @param {Object} searchElement Search block's DOM element.
 *
 * @return {number}              Available width within search block's parent.
 */
function getParentWidth( searchElement ) {
	// This is used when search block is aligned. This means there is a
	// temporary wrapper element between the search block and its actual parent.
	const searchParent = searchElement?.parentNode?.parentNode;

	if ( ! searchParent ) {
		return;
	}

	const parentStyles = getComputedStyle( searchParent );

	const availableWidth =
		searchParent.clientWidth -
		parseFloat( parentStyles.paddingLeft ) -
		parseFloat( parentStyles.paddingRight );

	return `${ availableWidth }px`;
}

/**
 * Determines if block has a percentage based width while aligned left or right.
 *
 * @param {Object} attributes           Search block attributes
 * @param {string} attributes.align     Block alignment attribute.
 * @param {number} attributes.width     Block's width value.
 * @param {string} attributes.widthUnit Block's width unit.
 *
 * @return {boolean} Whether the block has percentage aligned width.
 */
export function hasAlignedWidth( { align, width, widthUnit } ) {
	const isAlignedToSide = align === 'left' || align === 'right';

	return !! width && widthUnit === '%' && isAlignedToSide;
}

/**
 * Determines styles to apply to the root search block element when it is
 * aligned with a percentage width value in the editor.
 *
 * @param {Object} searchElement Search block DOM element from ref.
 * @param {Object} attributes    Search block attributes.
 *
 * @return {Object}              Inline styles to force proper width in editor.
 */
export function getAlignedStyles( searchElement, attributes ) {
	if ( ! searchElement ) {
		return;
	}

	const { align, width, widthUnit } = attributes;
	const isAlignedToSide = align === 'left' || align === 'right';

	if ( ! isAlignedToSide || widthUnit !== '%' ) {
		return;
	}

	// Get max width of current element if applied via custom layout on nested
	// group block.
	const { maxWidth } = getComputedStyle( searchElement );
	const hasPercentageMaxWidth = maxWidth.includes( '%' );

	// Get the parent block, or editor's, available width.
	const parentWidth = getParentWidth( searchElement );

	// Default to parent's available width.
	let availableWidth = parentWidth;

	// If explicit max width. Available width is min between max width and parent available width.
	if ( maxWidth !== 'none' && ! hasPercentageMaxWidth ) {
		availableWidth = `min(${ maxWidth }, ${ parentWidth })`;
	}

	// If percentage max width, apply that percentage to the parent's available width.
	if ( maxWidth !== 'none' && hasPercentageMaxWidth ) {
		const maxValue = parseFloat( maxWidth ) / 100;
		availableWidth = `calc(${ parentWidth } * ${ maxValue })`;
	}

	return {
		width: `calc(${ availableWidth } * ${ width / 100 })`,
		minWidth: MIN_WIDTH,
	};
}
