/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getColorValue, getColorClass, setColorValue } from './utils';
import { withEditorSettings } from '../editor-settings';

/**
 * Higher-order component, which handles color logic for class generation
 * color value, retrieval and color attribute setting.
 *
 * @param {WPElement} WrappedComponent The wrapped component.
 *
 * @return {Component} Component with a new colors prop.
 */
export default createHigherOrderComponent(
	withEditorSettings(
		( settings, props ) => {
			const colors = get( settings, [ 'colors' ], [] );
			return {
				initializeColor: ( { colorContext, colorAttribute, customColorAttribute } ) => ( {
					value: getColorValue(
						colors,
						props.attributes[ colorAttribute ],
						props.attributes[ customColorAttribute ]
					),
					class: getColorClass( colorContext, props.attributes[ colorAttribute ] ),
					set: setColorValue( colors, colorAttribute, customColorAttribute, props.setAttributes ),
				} ),
			};
		} ),
	'withColors'
);
