/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Modifies an SVG element to use the `currentColor` for its fill.
 *
 * In most cases you should be able to use the `currentColor` prop of the `Icon` component instead.
 *
 * ```jsx
 * import { wordpress } from '@wordpress/icons';
 * import { RangeControl } from '@wordpress/components';
 *
 * <RangeControl beforeIcon={ withCurrentColor( wordpress ) } />
 * ```
 */
export function withCurrentColor( svgElement: React.ReactElement ) {
	return cloneElement( svgElement, {
		className: classnames(
			'components-icon__svg-with-currentcolor',
			svgElement.props.className
		),
	} );
}
