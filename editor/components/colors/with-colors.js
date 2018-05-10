/**
 * External dependencies
 */
import { get, memoize } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getColorValue, getColorClass, setColorValue } from './utils';

const memoizedGetColor = memoize(
	( colors ) =>
		memoize(
			( colorName, customColorValue, colorContext ) => {
				return {
					name: colorName,
					class: getColorClass( colorContext, colorName ),
					value: getColorValue( colors, colorName, customColorValue ),
				};
			},
			( colorName, customColorValue, colorContext ) =>
				`${ colorName }-${ customColorValue }-${ colorContext }`
		)
);
/**
 * Even though, we don't expect setAttributes to change memoizing it is essential.
 * If setAttributes is not memoized, each time memoizedSetColor is called:
 * a new function reference is returned (even if setAttributes has not changed).
 * This would make our memoized chain useless.
 */
const memoizedSetColor = memoize(
	( setAttributes ) =>
		memoize(
			( colors ) =>
				memoize(
					( colorNameAttribute, customColorAttribute ) => {
						return setColorValue( colors, colorNameAttribute, customColorAttribute, setAttributes );
					},
					( colorNameAttribute, customColorAttribute ) =>
						`${ colorNameAttribute }-${ customColorAttribute }`
				)
		)
);

/**
 * Higher-order component, which handles color logic for class generation
 * color value, retrieval and color attribute setting.
 *
 * @param {Function} mapGetSetColorToProps Function that receives getColor, setColor, and props,
 *                                         and returns additional props to pass to the component.
 *
 * @return {Function} Higher-order component.
 */
export default ( mapGetSetColorToProps ) => createHigherOrderComponent(
	withSelect(
		( select, props ) => {
			const settings = select( 'core/editor' ).getEditorSettings();
			const colors = get( settings, [ 'colors' ], [] );
			return mapGetSetColorToProps( memoizedGetColor( colors ), memoizedSetColor( props.setAttributes )( colors ), props );
		} ),
	'withColors'
);
