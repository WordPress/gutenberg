/**
 * External dependencies
 */
import { get, isFunction, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, Component, compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { getColorValue, getColorClass, setColorValue } from './utils';
import { default as withColorsDeprecated } from './with-colors-deprecated';

const DEFAULT_COLORS = [];

/**
 * Higher-order component, which handles color logic for class generation
 * color value, retrieval and color attribute setting.
 *
 * @param {string} colorAttributeName       Name of the attribute where named colors are stored.
 * @param {string} customColorAttributeName Name of the attribute where custom colors are stored.
 * @param {string} colorContext             Context/place where color is being used e.g: background, text etc...
 *
 * @return {Function} Higher-order component.
 */
export default ( colorAttributeName, customColorAttributeName, colorContext ) => {
	if ( isFunction( colorAttributeName ) ) {
		deprecated( 'Using withColors( mapGetSetColorToProps ) ', {
			version: '3.1',
			alternative: 'withColors( colorAttributeName, customColorAttributeName, colorContext )',
		} );
		return withColorsDeprecated( colorAttributeName );
	}
	return createHigherOrderComponent(
		compose( [
			withSelect( ( select ) => {
				const settings = select( 'core/editor' ).getEditorSettings();
				return {
					colors: get( settings, [ 'colors' ], DEFAULT_COLORS ),
				};
			} ),
			( WrappedComponent ) => {
				return class extends Component {
					constructor( props ) {
						super( props );
						this.state = {};
					}

					static getDerivedStateFromProps( { attributes, colors, setAttributes }, prevState ) {
						const colorName = attributes[ colorAttributeName ];
						const customColor = attributes[ customColorAttributeName ];
						if (
							colorName === prevState.colorName &&
							customColor === prevState.customColor &&
							colors === prevState.colors &&
							setAttributes === prevState.setAttributes
						) {
							return null;
						}

						const colorObject = {
							name: attributes[ colorAttributeName ],
							class: getColorClass( colorContext, colorName ),
							value: getColorValue( colors, colorName, customColor ),
						};

						const colorSetter = setColorValue( colors, colorAttributeName, customColorAttributeName, setAttributes );

						return {
							colorName,
							customColor,
							colors,
							setAttributes,
							mergeProps: {
								[ colorAttributeName ]: colorObject,
								[ 'set' + upperFirst( colorAttributeName ) ]: colorSetter,
							},
						};
					}

					render() {
						return (
							<WrappedComponent
								{ ...{
									...this.props,
									colors: undefined,
									...this.state.mergeProps,
								} }
							/>
						);
					}
				};
			},
		] ),
		'withColors'
	);
};
