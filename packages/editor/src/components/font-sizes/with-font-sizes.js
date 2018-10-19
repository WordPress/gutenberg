/**
 * External dependencies
 */
import { isNumber, pickBy, reduce, some, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getDefaultFontSizeSlug,
	getFontSize,
	getFontSizeClass,
} from './utils';

/**
 * Higher-order component, which handles font size logic for class generation,
 * font size value retrieval, and font size change handling.
 *
 * @param {...(object|string)} args The arguments should all be strings
 *                                  Each string contains the font size attribute name e.g: 'fontSize'.
 *
 * @return {Function} Higher-order component.
 */
export default ( ...fontSizeNames ) => {
	/*
	* Computes an object whose key is the font size attribute name as passed in the array,
	* and the value is the custom font size attribute name.
	* Custom font size is automatically compted by appending custom followed by the font size attribute name in with the first letter capitalized.
	*/
	const fontSizeAttributeNames = reduce( fontSizeNames, ( fontSizeAttributeNamesAccumulator, fontSizeAttributeName ) => {
		fontSizeAttributeNamesAccumulator[ fontSizeAttributeName ] = `custom${ upperFirst( fontSizeAttributeName ) }`;
		return fontSizeAttributeNamesAccumulator;
	}, {} );

	return createHigherOrderComponent(
		compose( [
			withSelect( ( select ) => {
				const { fontSizes } = select( 'core/editor' ).getEditorSettings();
				return {
					fontSizes,
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
						return reduce( fontSizeAttributeNames, ( settersAccumulator, customFontSizeAttributeName, fontSizeAttributeName ) => {
							const upperFirstFontSizeAttributeName = upperFirst( fontSizeAttributeName );
							settersAccumulator[ `set${ upperFirstFontSizeAttributeName }` ] =
								this.createSetFontSize( fontSizeAttributeName, customFontSizeAttributeName );
							return settersAccumulator;
						}, {} );
					}

					createSetFontSize( fontSizeAttributeName, customFontSizeAttributeName ) {
						return ( value ) => {
							// Conditionally set the slug or numeric size.
							this.props.setAttributes( {
								[ fontSizeAttributeName ]: ( value === getDefaultFontSizeSlug || isNumber( value ) ) ? undefined : value,
								[ customFontSizeAttributeName ]: ( isNumber( value ) || value === '' ) ? value : undefined,
							} );
						};
					}

					static getDerivedStateFromProps( { attributes, fontSizes }, previousState ) {
						const didAttributesChange = ( customFontSizeAttributeName, fontSizeAttributeName ) => {
							if ( previousState[ fontSizeAttributeName ] ) {
								// If the new font size is a slug, compare with the previous slug.
								if ( attributes[ fontSizeAttributeName ] ) {
									return attributes[ fontSizeAttributeName ] !== previousState[ fontSizeAttributeName ];
								}

								// If the font size is not named, update when the font size value changes.
								return true;
							}

							// in this case we need to build the font size object
							return true;
						};

						if ( ! some( fontSizeAttributeNames, didAttributesChange ) ) {
							return null;
						}

						const newState = reduce(
							pickBy( fontSizeAttributeNames, didAttributesChange ),
							( newStateAccumulator, customFontSizeAttributeName, fontSizeAttributeName ) => {
								const fontSizeAttributeValue = attributes[ fontSizeAttributeName ];

								const fontSizeObject = getFontSize(
									fontSizes,
									fontSizeAttributeValue,
									attributes[ customFontSizeAttributeName ]
								);

								newStateAccumulator[ fontSizeAttributeName ] = {
									...fontSizeObject,
									class: getFontSizeClass( fontSizeAttributeValue ),
								};

								return newStateAccumulator;
							},
							{}
						);

						return {
							...previousState,
							...newState,
						};
					}

					render() {
						return (
							<WrappedComponent
								{ ...{
									...this.props,
									fontSizes: undefined,
									...this.state,
									...this.setters,
								} }
							/>
						);
					}
				};
			},
		] ),
		'withFontSizes'
	);
};
