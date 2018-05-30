/**
 * External dependencies
 */
import { flatMap, get, isFunction, isString, kebabCase, pick, reduce, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, Component, compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { deprecated } from '@wordpress/utils';
import isShallowEqual from '@wordpress/is-shallow-equal';

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
 * @param {...(object|string)} args The arguments can be strings or objects. If the argument is an object,
 *                                  it should contain the color attribute name as key and the color context as value.
 *                                  If the argument is a string the value should be the color attribute name,
 *                                  the color context is computed by applying a kebab case transform to the value.
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

	const relevantAttributeNames = flatMap(
		colorMap,
		( value, attributeName ) => [ attributeName, `custom${ upperFirst( attributeName ) }` ]
	);

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
						const relevantAttributes = pick( attributes, relevantAttributeNames );
						if (
							colors === prevState.colors &&
							setAttributes === prevState.setAttributes &&
							isShallowEqual( relevantAttributes, prevState.relevantAttributes )
						) {
							return null;
						}

						const mergeProps = reduce( colorMap, ( mergePropsAcc, colorContext, colorAttributeName ) => {
							const ufColorAttrName = upperFirst( colorAttributeName );
							const customColorAttributeName = `custom${ ufColorAttrName }`;
							const colorName = attributes[ colorAttributeName ];
							const customColor = attributes[ customColorAttributeName ];
							mergePropsAcc[ colorAttributeName ] = {
								name: colorName,
								class: getColorClass( colorContext, colorName ),
								value: getColorValue( colors, colorName, customColor ),
							};
							mergePropsAcc[ `set${ ufColorAttrName }` ] =
								setColorValue( colors, colorAttributeName, customColorAttributeName, setAttributes );
							return mergePropsAcc;
						}, {} );

						return {
							relevantAttributes,
							colors,
							setAttributes,
							mergeProps,
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
