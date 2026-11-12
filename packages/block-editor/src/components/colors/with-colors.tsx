import { useMemo, useRef } from '@wordpress/element';
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import { kebabCase } from '@wordpress/kebab-case';
import type { ComponentType } from 'react';
import type { Color } from '@wordpress/global-styles-engine';
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getMostReadableColor,
} from './utils';
import { useSettings } from '../use-settings';
import type {
	ColorAttributeName,
	ColorType,
	WithColorsHOC,
	WithColorsProps,
} from './types';

type ColorPaletteHOC = (
	Inner: ComponentType< WithColorsProps >
) => ComponentType< WithColorsProps >;

/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return {string} Capitalized string.
 */
const upperFirst = ( [ firstLetter, ...rest ]: string ): string =>
	firstLetter.toUpperCase() + rest.join( '' );

/**
 * Higher order component factory for injecting the `colorsArray` argument as
 * the colors prop in the `withCustomColors` HOC.
 *
 * @param colorsArray An array of color objects.
 *
 * @return The higher order component.
 */
const withCustomColorPalette = ( colorsArray: Color[] ) =>
	createHigherOrderComponent(
		( WrappedComponent: ComponentType< WithColorsProps > ) =>
			function WithCustomColorPalette( props: WithColorsProps ) {
				return <WrappedComponent { ...props } colors={ colorsArray } />;
			},
		'withCustomColorPalette'
	);

/**
 * Higher order component factory for injecting the editor colors as the
 * `colors` prop in the `withColors` HOC.
 *
 * @return The higher order component.
 */
const withEditorColorPalette = () =>
	createHigherOrderComponent(
		( WrappedComponent: ComponentType< WithColorsProps > ) =>
			function WithEditorColorPalette( props: WithColorsProps ) {
				const [ userPalette, themePalette, defaultPalette ] =
					useSettings(
						'color.palette.custom',
						'color.palette.theme',
						'color.palette.default'
					);
				// The settings list the palettes' colors.
				const allColors = useMemo(
					() => [
						...( ( userPalette as Color[] | undefined ) || [] ),
						...( ( themePalette as Color[] | undefined ) || [] ),
						...( ( defaultPalette as Color[] | undefined ) || [] ),
					],
					[ userPalette, themePalette, defaultPalette ]
				);
				return <WrappedComponent { ...props } colors={ allColors } />;
			},
		'withEditorColorPalette'
	);

/**
 * Helper function used with `createHigherOrderComponent` to create
 * higher order components for managing color logic.
 *
 * @param colorTypes       An array of color types (e.g. 'backgroundColor, borderColor).
 * @param withColorPalette A HOC for injecting the 'colors' prop into the WrappedComponent.
 *
 * @return The component that can be used as a HOC.
 */
function createColorHOC(
	colorTypes: ColorType[],
	withColorPalette: ColorPaletteHOC
) {
	const colorMap = colorTypes.reduce< Record< string, string > >(
		( colorObject, colorType ) => {
			return {
				...colorObject,
				...( typeof colorType === 'string'
					? { [ colorType ]: kebabCase( colorType ) }
					: colorType ),
			};
		},
		{}
	);

	// `compose` loses the types of the components it composes.
	return compose( [
		withColorPalette,
		( WrappedComponent: ComponentType< WithColorsProps > ) => {
			return function WithColors( props: WithColorsProps ) {
				const { colors: _colors, ...passedProps } = props;
				const { attributes, setAttributes } = passedProps;
				const prevColorPropsRef = useRef< Record<
					string,
					{ color?: string }
				> | null >( null );

				const colorProps = useMemo( () => {
					const prevColorProps = prevColorPropsRef.current;

					const result = Object.fromEntries(
						Object.entries( colorMap ).flatMap(
							( [ colorAttributeName, colorContext ] ) => {
								const customAttr = `custom${ upperFirst(
									colorAttributeName
								) }`;
								const upperFirstColorAttributeName =
									upperFirst( colorAttributeName );

								const colorObject =
									getColorObjectByAttributeValues(
										_colors,
										// The color attributes hold a slug and a value.
										attributes[ colorAttributeName ] as
											string | null | undefined,
										attributes[ customAttr ] as
											string | null | undefined
									);

								const prevColorValue =
									prevColorProps?.[ colorAttributeName ];
								const colorValue =
									prevColorValue?.color ===
										colorObject.color && prevColorValue
										? prevColorValue
										: {
												...colorObject,
												class: getColorClassName(
													colorContext,
													colorObject.slug
												),
											};

								const setter = ( newColorValue?: string ) => {
									const resolvedColorObject =
										getColorObjectByColorValue(
											_colors,
											newColorValue
										);
									setAttributes( {
										[ colorAttributeName ]:
											resolvedColorObject?.slug ||
											undefined,
										[ customAttr ]:
											resolvedColorObject?.slug
												? undefined
												: newColorValue,
									} );
								};

								return [
									[ colorAttributeName, colorValue ],
									[
										`set${ upperFirstColorAttributeName }`,
										setter,
									],
								];
							}
						)
					);

					prevColorPropsRef.current = result;
					return result;
				}, [ attributes, _colors, setAttributes ] );

				const colorUtils = useMemo(
					() => ( {
						getMostReadableColor: ( colorValue?: string ) =>
							// The palette HOC always passes the colors.
							getMostReadableColor( _colors!, colorValue ),
					} ),
					[ _colors ]
				);

				return (
					<WrappedComponent
						{ ...{
							...passedProps,
							...colorProps,
							colorUtils,
						} }
					/>
				);
			};
		},
	] ) as ColorPaletteHOC;
}

/**
 * A higher-order component factory for creating a 'withCustomColors' HOC, which handles color logic
 * for class generation color value, retrieval and color attribute setting.
 *
 * Use this higher-order component to work with a custom set of colors.
 *
 * @example
 *
 * ```jsx
 * const CUSTOM_COLORS = [ { name: 'Red', slug: 'red', color: '#ff0000' }, { name: 'Blue', slug: 'blue', color: '#0000ff' } ];
 * const withCustomColors = createCustomColorsHOC( CUSTOM_COLORS );
 * // ...
 * export default compose(
 *     withCustomColors( 'backgroundColor', 'borderColor' ),
 *     MyColorfulComponent,
 * );
 * ```
 *
 * @param {Array} colorsArray The array of color objects (name, slug, color, etc... ).
 *
 * @return {Function} Higher-order component.
 */
export function createCustomColorsHOC( colorsArray: Color[] ) {
	return < Types extends ColorType[] >( ...colorTypes: Types ) => {
		const withColorPalette = withCustomColorPalette( colorsArray );
		// Types the props each call injects.
		return createHigherOrderComponent(
			createColorHOC( colorTypes, withColorPalette ),
			'withCustomColors'
		) as WithColorsHOC< ColorAttributeName< Types[ number ] > >;
	};
}

/**
 * A higher-order component, which handles color logic for class generation color value, retrieval and color attribute setting.
 *
 * For use with the default editor/theme color palette.
 *
 * @example
 *
 * ```jsx
 * export default compose(
 *     withColors( 'backgroundColor', { textColor: 'color' } ),
 *     MyColorfulComponent,
 * );
 * ```
 *
 * @param {...(Object|string)} colorTypes The arguments can be strings or objects. If the argument is an object,
 *                                        it should contain the color attribute name as key and the color context as value.
 *                                        If the argument is a string the value should be the color attribute name,
 *                                        the color context is computed by applying a kebab case transform to the value.
 *                                        Color context represents the context/place where the color is going to be used.
 *                                        The class name of the color is generated using 'has' followed by the color name
 *                                        and ending with the color context all in kebab case e.g: has-green-background-color.
 *
 * @return {Function} Higher-order component.
 */
export default function withColors< Types extends ColorType[] >(
	...colorTypes: Types
) {
	const withColorPalette = withEditorColorPalette();
	// Types the props each call injects.
	return createHigherOrderComponent(
		createColorHOC( colorTypes, withColorPalette ),
		'withColors'
	) as WithColorsHOC< ColorAttributeName< Types[ number ] > >;
}
