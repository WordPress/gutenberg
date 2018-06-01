/**
 * External dependencies
 */
import { find, get, isFunction, isString, kebabCase, reduce, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, Component, compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { deprecated } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { getColorValue, getColorClass } from './utils';
import { default as withColorsDeprecated } from './with-colors-deprecated';

const DEFAULT_COLORS = [];

/**
 * Higher-order component, which handles color logic for class generation
 * color value, retrieval and color attribute setting.
 *
 * @param {...(object|string)} args The arguments can be strings or objects. If the argument is an object,
 *                                  it should contain the color attribute name as key and the color context as value.
 *                                  If the argument is a string the value should be the color attribute name,
 *                                  the color context is computed by applying a kebab case transform to the value.
 *                                  Color context represents the context/place where the color is going to be used.
 *                                  The class name of the color is generated using 'has' followed by the color name
 *                                  and ending with the color context all in kebab case e.g: has-green-background-color.
 *
 *
 * @return {Function} Higher-order component.
 */
export default ( ...args ) => {
	if ( isFunction( args[ 0 ] ) ) {
		deprecated( 'Using withColors( mapGetSetColorToProps ) ', {
			version: '3.2',
			alternative: 'withColors( colorAttributeName, { secondColorAttributeName: \'color-context\' }, ... )',
		} );
		return withColorsDeprecated( args[ 0 ] );
	}

	const colorMap = reduce( args, ( colorObj, arg ) => {
		return {
			...colorObj,
			...( isString( arg ) ? { [ arg ]: kebabCase( arg ) } : arg ),
		};
	}, {} );

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

						this.setters = this.createSetters();

						this.state = {};
					}

					createSetters() {
						return reduce( colorMap, ( settersAcc, colorContext, colorAttributeName ) => {
							const ufColorAttrName = upperFirst( colorAttributeName );
							const customColorAttributeName = `custom${ ufColorAttrName }`;
							settersAcc[ `set${ ufColorAttrName }` ] = this.createSetColor( colorAttributeName, customColorAttributeName );
							return settersAcc;
						}, {} );
					}

					createSetColor( colorAttributeName, customColorAttributeName ) {
						return ( colorValue ) => {
							const colorObj = find( this.props.colors, { color: colorValue } );
							this.props.setAttributes( {
								[ colorAttributeName ]: colorObj && colorObj.name ? colorObj.name : undefined,
								[ customColorAttributeName ]: colorObj && colorObj.name ? undefined : colorValue,
							} );
						};
					}

					static getDerivedStateFromProps( { attributes, colors }, prevState ) {
						return reduce( colorMap, ( newState, colorContext, colorAttributeName ) => {
							const colorName = attributes[ colorAttributeName ];
							const colorValue = getColorValue(
								colors,
								colorName,
								attributes[ `custom${ upperFirst( colorAttributeName ) }` ]
							);
							const prevColorObject = prevState[ colorAttributeName ];
							const prevColorValue = get( prevColorObject, [ 'value' ] );
							/**
							* && prevColorObject checks that a previous color object was already computed.
							* At the start prevColorValue and colorValue are both equal to undefined
							* bus as prevColorObject does not exist we should compute the object.
							*/
							if ( prevColorValue === colorValue && prevColorObject ) {
								newState[ colorAttributeName ] = prevColorObject;
							} else {
								newState[ colorAttributeName ] = {
									name: colorName,
									class: getColorClass( colorContext, colorName ),
									value: colorValue,
								};
							}
							return newState;
						}, {} );
					}

					render() {
						return (
							<WrappedComponent
								{ ...{
									...this.props,
									colors: undefined,
									...this.state,
									...this.setters,
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
