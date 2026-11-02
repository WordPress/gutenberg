import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import type { ComponentClass, ComponentType, FunctionComponent } from 'react';
import type { FontSizePreset } from '@wordpress/global-styles-engine';
import { getFontSize, getFontSizeClass } from './utils';
import { useSettings } from '../use-settings';
import type {
	FontSizeSetters,
	IncompatibleInjectedProps,
	InjectedFontSizesProps,
	WithFontSizesProps,
	WithFontSizesState,
} from './types';

const DEFAULT_FONT_SIZES: FontSizePreset[] = [];

/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return Capitalized string.
 */
const upperFirst = ( [ firstLetter, ...rest ]: string ): string =>
	firstLetter.toUpperCase() + rest.join( '' );

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
export default < Name extends string >( ...fontSizeNames: Name[] ) => {
	/*
	 * Computes an object whose key is the font size attribute name as passed in the array,
	 * and the value is the custom font size attribute name.
	 * Custom font size is automatically compted by appending custom followed by the font size attribute name in with the first letter capitalized.
	 */
	const fontSizeAttributeNames = fontSizeNames.reduce(
		( fontSizeAttributeNamesAccumulator, fontSizeAttributeName ) => {
			fontSizeAttributeNamesAccumulator[ fontSizeAttributeName ] =
				`custom${ upperFirst( fontSizeAttributeName ) }`;
			return fontSizeAttributeNamesAccumulator;
		},
		// The reducer fills the empty object.
		{} as Record< string, string >
	);

	// The outer cast types the props each call injects.
	return createHigherOrderComponent(
		// `compose` loses the types of the components it composes.
		compose( [
			createHigherOrderComponent(
				( WrappedComponent: ComponentType< WithFontSizesProps > ) =>
					function WithFontSizesInner( props: WithFontSizesProps ) {
						const [ fontSizes ] = useSettings(
							'typography.fontSizes'
						);
						return (
							<WrappedComponent
								{ ...props }
								// The setting lists the font size presets.
								fontSizes={
									( fontSizes as
										FontSizePreset[] | undefined ) ||
									DEFAULT_FONT_SIZES
								}
							/>
						);
					},
				'withFontSizes'
			),
			( WrappedComponent: ComponentType< WithFontSizesProps > ) => {
				return class WithFontSizes extends Component<
					WithFontSizesProps,
					WithFontSizesState
				> {
					declare setters: FontSizeSetters;

					constructor( props: WithFontSizesProps ) {
						super( props );

						this.setters = this.createSetters();

						this.state = {};
					}

					createSetters(): FontSizeSetters {
						return Object.entries( fontSizeAttributeNames ).reduce(
							(
								settersAccumulator,
								[
									fontSizeAttributeName,
									customFontSizeAttributeName,
								]
							) => {
								const upperFirstFontSizeAttributeName =
									upperFirst( fontSizeAttributeName );
								settersAccumulator[
									`set${ upperFirstFontSizeAttributeName }`
								] = this.createSetFontSize(
									fontSizeAttributeName,
									customFontSizeAttributeName
								);
								return settersAccumulator;
							},
							// The reducer fills the empty object.
							{} as FontSizeSetters
						);
					}

					createSetFontSize(
						fontSizeAttributeName: string,
						customFontSizeAttributeName: string
					) {
						return ( fontSizeValue?: number | string ) => {
							const fontSizeObject = this.props.fontSizes?.find(
								( { size } ) => size === Number( fontSizeValue )
							);
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
						{ attributes, fontSizes }: WithFontSizesProps,
						previousState: WithFontSizesState
					) {
						const didAttributesChange = (
							customFontSizeAttributeName: string,
							// `some` passes the index here, as it always has.
							fontSizeAttributeName: string | number
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
							! Object.values( fontSizeAttributeNames ).some(
								didAttributesChange
							)
						) {
							return null;
						}

						const newState = Object.entries(
							fontSizeAttributeNames
						)
							.filter( ( [ key, value ] ) =>
								didAttributesChange( value, key )
							)
							.reduce(
								(
									newStateAccumulator,
									[
										fontSizeAttributeName,
										customFontSizeAttributeName,
									]
								) => {
									// The font size attribute holds a slug.
									const fontSizeAttributeValue = attributes[
										fontSizeAttributeName
									] as string | undefined;
									const fontSizeObject = getFontSize(
										fontSizes,
										fontSizeAttributeValue,
										// The custom font size attribute holds a size.
										attributes[
											customFontSizeAttributeName
										] as number | string | undefined
									);
									newStateAccumulator[
										fontSizeAttributeName
									] = {
										...fontSizeObject,
										class: getFontSizeClass(
											fontSizeAttributeValue
										),
									};
									return newStateAccumulator;
								},
								// The reducer fills the empty object.
								{} as WithFontSizesState
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
		] ) as (
			Inner: ComponentType< WithFontSizesProps >
		) => ComponentType< WithFontSizesProps >,
		'withFontSizes'
	) as < Props >(
		WrappedComponent: (
			| FunctionComponent< Props & InjectedFontSizesProps< Name > >
			// A class component's `props` type must match, so it takes its own props.
			| ComponentClass< Props >
		) &
			IncompatibleInjectedProps< Props, InjectedFontSizesProps< Name > >
	) => ComponentType<
		Omit< Props, keyof InjectedFontSizesProps< Name > > &
			Pick< WithFontSizesProps, 'attributes' | 'setAttributes' >
	>;
};
