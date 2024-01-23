/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { cloneElement } from '@wordpress/element';

/**
 * Modifies an element to use the `currentColor` for the fills in its SVG descendants.
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
export function withCurrentColor( element: React.ReactElement ) {
	return cloneElement( element, {
		className: classnames(
			'components-icon__with-currentcolor',
			element.props.className
		),
	} );
}
