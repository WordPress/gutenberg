/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, compose } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getFontSize, getFontSizeClass } from './utils';
import { useSettings } from '../use-settings';

const DEFAULT_FONT_SIZES = [];

/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return {string} Capitalized string.
 */
const upperFirst = ( [ firstLetter, ...rest ] ) =>
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
export default ( ...fontSizeNames ) => {
	/*
	 * Computes an object whose key is the font size attribute name as passed in the array,
	 * and the value is the custom font size attribute name.
	 * Custom font size is automatically compted by appending custom followed by the font size attribute name in with the first letter capitalized.
	 */
	const fontSizeAttributeNames = fontSizeNames.reduce(
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
				( WrappedComponent ) =>
					function WithFontSizesInner( props ) {
						const [ fontSizes ] = useSettings(
							'typography.fontSizes'
						);
						return (
							<WrappedComponent
								{ ...props }
								fontSizes={ fontSizes || DEFAULT_FONT_SIZES }
							/>
						);
					},
				'withFontSizes'
			),
			( WrappedComponent ) => {
				return function WithFontSizes( props ) {
					const { attributes, fontSizes, setAttributes } = props;

					const fontSizeValues = useMemo(
						() =>
							Object.entries( fontSizeAttributeNames ).reduce(
								(
									accumulator,
									[
										fontSizeAttributeName,
										customFontSizeAttributeName,
									]
								) => {
									const fontSizeAttributeValue =
										attributes[ fontSizeAttributeName ];
									const fontSizeObject = getFontSize(
										fontSizes,
										fontSizeAttributeValue,
										attributes[
											customFontSizeAttributeName
										]
									);
									accumulator[ fontSizeAttributeName ] = {
										...fontSizeObject,
										class: getFontSizeClass(
											fontSizeAttributeValue
										),
									};
									return accumulator;
								},
								{}
							),
						[ attributes, fontSizes ]
					);

					const setters = useMemo(
						() =>
							Object.entries( fontSizeAttributeNames ).reduce(
								(
									accumulator,
									[
										fontSizeAttributeName,
										customFontSizeAttributeName,
									]
								) => {
									const upperName = upperFirst(
										fontSizeAttributeName
									);
									accumulator[ `set${ upperName }` ] = (
										fontSizeValue
									) => {
										const fontSizeObject = fontSizes?.find(
											( { size } ) =>
												size === Number( fontSizeValue )
										);
										setAttributes( {
											[ fontSizeAttributeName ]:
												fontSizeObject?.slug ||
												undefined,
											[ customFontSizeAttributeName ]:
												fontSizeObject?.slug
													? undefined
													: fontSizeValue,
										} );
									};
									return accumulator;
								},
								{}
							),
						[ fontSizes, setAttributes ]
					);

					return (
						<WrappedComponent
							{ ...props }
							fontSizes={ undefined }
							{ ...fontSizeValues }
							{ ...setters }
						/>
					);
				};
			},
		] ),
		'withFontSizes'
	);
};
