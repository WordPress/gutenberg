/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getColorValue, getColorClass, setColorValue } from './utils';

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
			const getColor = ( colorName, customColorValue, colorContext ) => {
				return {
					name: colorName,
					class: getColorClass( colorContext, colorName ),
					value: getColorValue( colors, colorName, customColorValue ),
				};
			};
			const setColor = ( colorNameAttribute, customColorAttribute, setAttributes ) => {
				return setColorValue( colors, colorNameAttribute, customColorAttribute, setAttributes );
			};
			return mapGetSetColorToProps( getColor, setColor, props );
		} ),
	'withColors'
);
