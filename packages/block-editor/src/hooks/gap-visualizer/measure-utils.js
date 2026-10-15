/**
 * Selector for legacy inner layout container wrappers.
 */
export const LEGACY_INNER_CONTAINER_SELECTOR =
	':scope > .wp-block-group__inner-container, :scope > .wp-block-cover__inner-container';

/**
 * Resolves the layout container element for a given block element.
 * Returns the legacy inner wrapper if present, otherwise the block element itself.
 *
 * @param {Element|null} blockElement Block DOM element.
 *
 * @return {Element|null} The resolved layout container element.
 */
export function getLayoutContainer( blockElement ) {
	if ( ! blockElement ) {
		return null;
	}
	return (
		blockElement.querySelector( LEGACY_INNER_CONTAINER_SELECTOR ) ||
		blockElement
	);
}

/**
 * Extracts the effective CSS transform scale of a container element relative to its offsetWidth.
 *
 * @param {HTMLElement} containerElement The container DOM node.
 * @param {DOMRect}     containerRect    The bounding client rect of the container.
 *
 * @return {number} The scale factor (default 1).
 */
export function getContainerScale( containerElement, containerRect ) {
	const offsetWidth = containerElement.offsetWidth;
	return offsetWidth > 0 &&
		Number.isFinite( containerRect.width / offsetWidth ) &&
		containerRect.width / offsetWidth > 0
		? containerRect.width / offsetWidth
		: 1;
}

/**
 * Checks whether a child element is participating in in-flow layout.
 *
 * @param {CSSStyleDeclaration} childStyle Computed style of the child.
 *
 * @return {boolean} True if the child is in-flow.
 */
export function isChildInFlow( childStyle ) {
	if ( childStyle.display === 'none' ) {
		return false;
	}
	if (
		childStyle.position === 'absolute' ||
		childStyle.position === 'fixed'
	) {
		return false;
	}
	return true;
}

/**
 * Normalizes a child's border-box coordinates relative to the container's
 * border-box origin, divided by the scale factor.
 * Returns null if the child has zero width and height.
 *
 * @param {Element} element       Child DOM element.
 * @param {DOMRect} containerRect Container bounding client rect.
 * @param {number}  scale         Container scale factor.
 *
 * @return {Object|null} Normalized borderBox coordinates or null if zero size.
 */
export function getNormalizedChildBox( element, containerRect, scale ) {
	const childRect = element.getBoundingClientRect();
	if ( childRect.width === 0 && childRect.height === 0 ) {
		return null;
	}

	const normLeft = ( childRect.left - containerRect.left ) / scale;
	const normTop = ( childRect.top - containerRect.top ) / scale;
	const normWidth = childRect.width / scale;
	const normHeight = childRect.height / scale;

	return {
		left: normLeft,
		top: normTop,
		right: normLeft + normWidth,
		bottom: normTop + normHeight,
		width: normWidth,
		height: normHeight,
	};
}
