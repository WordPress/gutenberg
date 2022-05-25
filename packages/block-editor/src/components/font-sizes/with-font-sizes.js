/**
 * External dependencies
 */
import { find, pickBy, reduce, some, upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getFontSize, getFontSizeClass } from './utils';
import useSetting from '../use-setting';

const DEFAULT_FONT_SIZES = [];

/**
 * Higher-order component, which handles font size logic for class generation,
 * font size value retrieval, and font size change handling.
 *
 * @param {...(Object|string)} fontSizeNames The arguments should all be strings.
 *                                           Each string contains the font size
 *                                           attribute name e.g: 'fontSize'.
 *
 * @return {Function} Higher-order component.
 */
export default ( ...fontSizeNames ) => {
	/*
	 * Computes an object whose key is the font size attribute name as passed in the array,
	 * and the value is the custom font size attribute name.
	 * Custom font size is automatically compted by appending custom followed by the font size attribute name in with the first letter capitalized.
	 */
	const fontSizeAttributeNames = reduce(
		fontSizeNames,
		( fontSizeAttributeNamesAccumulator, fontSizeAttributeName ) => {
			fontSizeAttributeNamesAccumulator[
				fontSizeAttributeName
			] = `custom${ upperFirst( fontSizeAttributeName ) }`;
			return fontSizeAttributeNamesAccumulator;
		},
		{}
	);

	return createHigherOrderComponent(
		compose( [
			createHigherOrderComponent(
				( WrappedComponent ) => ( props ) => {
					const fontSizes =
						useSetting( 'typography.fontSizes' ) ||
						DEFAULT_FONT_SIZES;
					return (
						<WrappedComponent
							{ ...props }
							fontSizes={ fontSizes }
						/>
					);
				},
				'withFontSizes'
			),
			( WrappedComponent ) => {
				return class extends Component {
					constructor( props ) {
						super( props );

						this.setters = this.createSetters();

						this.state = {};
					}

					createSetters() {
						return reduce(
							fontSizeAttributeNames,
							(
								settersAccumulator,
								customFontSizeAttributeName,
								fontSizeAttributeName
							) => {
								const upperFirstFontSizeAttributeName = upperFirst(
									fontSizeAttributeName
								);
								settersAccumulator[
									`set${ upperFirstFontSizeAttributeName }`
								] = this.createSetFontSize(
									fontSizeAttributeName,
									customFontSizeAttributeName
								);
								return settersAccumulator;
							},
							{}
						);
					}

					createSetFontSize(
						fontSizeAttributeName,
						customFontSizeAttributeName
					) {
						return ( fontSizeValue ) => {
							const fontSizeObject = find( this.props.fontSizes, {
								size: Number( fontSizeValue ),
							} );
							this.props.setAttributes( {
								[ fontSizeAttributeName ]:
									fontSizeObject && fontSizeObject.slug
										? fontSizeObject.slug
										: undefined,
								[ customFontSizeAttributeName ]:
									fontSizeObject && fontSizeObject.slug
										? undefined
										: fontSizeValue,
							} );
						};
					}

					static getDerivedStateFromProps(
						{ attributes, fontSizes },
						previousState
					) {
						const didAttributesChange = (
							customFontSizeAttributeName,
							fontSizeAttributeName
						) => {
							if ( previousState[ fontSizeAttributeName ] ) {
								// If new font size is name compare with the previous slug.
								if ( attributes[ fontSizeAttributeName ] ) {
									return (
										attributes[ fontSizeAttributeName ] !==
										previousState[ fontSizeAttributeName ]
											.slug
									);
								}
								// If font size is not named, update when the font size value changes.
								return (
									previousState[ fontSizeAttributeName ]
										.size !==
									attributes[ customFontSizeAttributeName ]
								);
							}
							// In this case we need to build the font size object.
							return true;
						};

						if (
							! some(
								fontSizeAttributeNames,
								didAttributesChange
							)
						) {
							return null;
						}

						const newState = reduce(
							pickBy(
								fontSizeAttributeNames,
								didAttributesChange
							),
							(
								newStateAccumulator,
								customFontSizeAttributeName,
								fontSizeAttributeName
							) => {
								const fontSizeAttributeValue =
									attributes[ fontSizeAttributeName ];
								const fontSizeObject = getFontSize(
									fontSizes,
									fontSizeAttributeValue,
									attributes[ customFontSizeAttributeName ]
								);
								newStateAccumulator[ fontSizeAttributeName ] = {
									...fontSizeObject,
									class: getFontSizeClass(
										fontSizeAttributeValue
									),
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
