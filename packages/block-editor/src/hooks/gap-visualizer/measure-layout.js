import { measureFlexLayout } from './measure-flex-layout';
import { computeFlexGapRects } from './compute-flex-gap-rects';
import {
	LEGACY_INNER_CONTAINER_SELECTOR,
	getLayoutContainer,
} from './measure-utils';

export {
	LEGACY_INNER_CONTAINER_SELECTOR,
	getLayoutContainer,
	measureFlexLayout,
	computeFlexGapRects,
};

/**
 * Dispatches DOM measurement and gap calculation based on the container
 * element's computed display property.
 *
 * @param {HTMLElement|null} containerElement The container DOM element.
 *
 * @return {Array<Object>} List of computed gap rectangles.
 */
export function measureGapLayout( containerElement ) {
	if ( ! containerElement ) {
		return [];
	}

	const layoutContainer = getLayoutContainer( containerElement );

	const defaultView = containerElement.ownerDocument?.defaultView || window;
	const display = defaultView.getComputedStyle( layoutContainer ).display;

	if ( display === 'flex' || display === 'inline-flex' ) {
		const { boxes, config } = measureFlexLayout(
			layoutContainer,
			containerElement
		);
		return computeFlexGapRects( boxes, config );
	}

	return [];
}
