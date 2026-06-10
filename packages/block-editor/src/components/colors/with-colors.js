/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useEffect, useState } from '@wordpress/element';
import { compose, createHigherOrderComponent } from '@wordpress/compose';
import { privateApis as componentsPrivateApis } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	getMostReadableColor,
} from './utils';
import { useSettings } from '../use-settings';
import { unlock } from '../../lock-unlock';

const { kebabCase } = unlock( componentsPrivateApis );

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
 * Higher order component factory for injecting the `colorsArray` argument as
 * the colors prop in the `withCustomColors` HOC.
 *
 * @param {Array} colorsArray An array of color objects.
 *
 * @return {Function} The higher order component.
 */
const withCustomColorPalette = ( colorsArray ) =>
	createHigherOrderComponent(
		( WrappedComponent ) =>
			function WithCustomColorPalette( props ) {
				return <WrappedComponent { ...props } colors={ colorsArray } />;
			},
		'withCustomColorPalette'
	);

/**
 * Higher order component factory for injecting the editor colors as the
 * `colors` prop in the `withColors` HOC.
 *
 * @return {Function} The higher order component.
 */
const withEditorColorPalette = () =>
	createHigherOrderComponent(
		( WrappedComponent ) =>
			function WithEditorColorPalette( props ) {
				const [ userPalette, themePalette, defaultPalette ] =
					useSettings(
						'color.palette.custom',
						'color.palette.theme',
						'color.palette.default'
					);
				const allColors = useMemo(
					() => [
						...( userPalette || [] ),
						...( themePalette || [] ),
						...( defaultPalette || [] ),
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
 * @param {Array}    colorTypes       An array of color types (e.g. 'backgroundColor, borderColor).
 * @param {Function} withColorPalette A HOC for injecting the 'colors' prop into the WrappedComponent.
 *
 * @return {Component} The component that can be used as a HOC.
 */
function createColorHOC( colorTypes, withColorPalette ) {
	const colorMap = colorTypes.reduce( ( colorObject, colorType ) => {
		return {
			...colorObject,
			...( typeof colorType === 'string'
				? { [ colorType ]: kebabCase( colorType ) }
				: colorType ),
		};
	}, {} );

	function computeDerivedColorState( attributes, colors, prevState = {} ) {
		return Object.entries( colorMap ).reduce(
			( acc, [ colorAttributeName, colorContext ] ) => {
				const customAttr = `custom${ upperFirst(
					colorAttributeName
				) }`;
				const colorObject = getColorObjectByAttributeValues(
					colors,
					attributes[ colorAttributeName ],
					attributes[ customAttr ]
				);

				const prevColor = prevState[ colorAttributeName ]?.color;
				const prevColorObject = prevState[ colorAttributeName ];

				acc[ colorAttributeName ] =
					prevColor === colorObject.color && prevColorObject
						? prevColorObject
						: {
								...colorObject,
								class: getColorClassName(
									colorContext,
									colorObject.slug
								),
						  };

				return acc;
			},
			{}
		);
	}

	return compose( [
		withColorPalette,
		( WrappedComponent ) => {
			return function WithColors( props ) {
				const { colors, attributes, setAttributes } = props;

				const [ colorState, setColorState ] = useState( () =>
					computeDerivedColorState( attributes, colors )
				);

				const getMostReadableColorFn = useCallback(
					( colorValue ) =>
						getMostReadableColor( colors, colorValue ),
					[ colors ]
				);

				const colorUtils = useMemo(
					() => ( {
						getMostReadableColor: getMostReadableColorFn,
					} ),
					[ getMostReadableColorFn ]
				);

				const setters = useMemo( () => {
					return Object.keys( colorMap ).reduce(
						( acc, colorAttributeName ) => {
							const upperFirstColorAttributeName =
								upperFirst( colorAttributeName );
							const customColorAttributeName = `custom${ upperFirstColorAttributeName }`;

							acc[ `set${ upperFirstColorAttributeName }` ] = (
								colorValue
							) => {
								const colorObject = getColorObjectByColorValue(
									colors,
									colorValue
								);

								setAttributes( {
									[ colorAttributeName ]:
										colorObject?.slug || undefined,
									[ customColorAttributeName ]:
										colorObject?.slug
											? undefined
											: colorValue,
								} );
							};

							return acc;
						},
						{}
					);
				}, [ colors, setAttributes ] );

				// Mimic the behavior of getDerivedStateFromProps.
				useEffect( () => {
					setColorState( ( prevState ) =>
						computeDerivedColorState(
							attributes,
							colors,
							prevState
						)
					);
				}, [ attributes, colors ] );

				return (
					<WrappedComponent
						{ ...{
							...props,
							colors: undefined,
							...colorState,
							...setters,
							colorUtils,
						} }
					/>
				);
			};
		},
	] );
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
export function createCustomColorsHOC( colorsArray ) {
	return ( ...colorTypes ) => {
		const withColorPalette = withCustomColorPalette( colorsArray );
		return createHigherOrderComponent(
			createColorHOC( colorTypes, withColorPalette ),
			'withCustomColors'
		);
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
export default function withColors( ...colorTypes ) {
	const withColorPalette = withEditorColorPalette();
	return createHigherOrderComponent(
		createColorHOC( colorTypes, withColorPalette ),
		'withColors'
	);
}
