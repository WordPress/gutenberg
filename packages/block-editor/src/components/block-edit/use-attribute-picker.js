/**
 * External dependencies
 */
import { upperFirst } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useShallowCompareDep, useDeepCompareDep } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from './context';

/**
 * Low level hook that takes an options object that has a list of attributes to manage, values that they can be set to,
 * and functions for customizing how values are compared, saved, and returned. It also handles setting attributes to
 * custom values and provides an easy way to bind utilities.
 * It returns an object with mapped attributes, attribute setters, and bound utilities.
 * It can be used to write hooks like `useColors`.
 *
 * @see [useColors](/packages/block-editor/README.md#useColors)
 *
 * @param {Object}                 attributePickerOptions                           The options object.
 *
 * @param {string[]}               attributePickerOptions.names                     The list of attributes to manage.
 *
 * @param {*[]}                    attributePickerOptions.valuesEnum                The list of values attributes can be set to.
 *                                                                                   Setting an attribute to a custom value not on
 *                                                                                   this list will set the attribute's value to
 *                                                                                   `undefined` and the corresponding `custom${ upperFirst( name ) }`
 *                                                                                   attribute to the custom value.
 *
 * @param {Function}               [attributePickerOptions.findEnumValue]           Function for comparing an enum value to the
 *                                                                                   value passed to the setter, when looking for
 *                                                                                   the value in the enum. Defaults to shallow comparison.
 *
 * @param {Function}               [attributePickerOptions.mapEnumValue]            Function for mapping the enum value found with
 *                                                                                   `findEnumValue` before saving it, if found.
 *                                                                                   Otherwise, the value is assumed to be custom and saved as is.
 *
 * @param {*[]}                    [attributePickerOptions.findAndMapEnumValueDeps] List of items that, if they fail a shallow equality test, will
 *                                                                                   cause new setters to be returned. Useful if your `findEnumValue` or `mapEnumValue` have closures.
 *
 * @param {Function}               [attributePickerOptions.mapAttribute]            Function for mapping attributes before returning them, called
 *                                                                                   with the attribute's or custom attribute's value and the name.
 *
 * @param {*[]}                    [attributePickerOptions.mapAttributeDeps]        List of items that, if they fail a shallow equality test, will
 *                                                                                   cause attributes to be mapped again. Useful if your `mapAttribute` has closures.
 *
 * @param {{ string: Function }}   [attributePickerOptions.utilsToBind]             Object with functions to bind to `valuesEnum` and merge into the
 *                                                                                   returned object. Useful for utilities that need to be bound.
 *
 * @param {*[]}                    [attributePickerOptions.utilsToBindDeps]         List of items that, if they fail a shallow equality test, will
 *                                                                                   cause `utilsToBind` to be bound again. Useful if any of your utils has closures.
 *
 * @return {Object} The object with mapped attributes and attribute setters.
 */
export default function useAttributePicker( {
	names,
	valuesEnum,

	findEnumValue = ( enumValue, newValue ) => enumValue === newValue,
	mapEnumValue = ( enumValue ) => enumValue,
	findAndMapEnumValueDeps = [],

	mapAttribute = ( mappedEnumValueOrCustomValue ) => mappedEnumValueOrCustomValue,
	mapAttributeDeps = [],

	utilsToBind = {},
	utilsToBindDeps = [],
} ) {
	const { setAttributes, attributes } = useBlockEditContext();
	const namesDep = useShallowCompareDep( names );
	const valuesEnumDep = useDeepCompareDep( valuesEnum );

	const setters = useMemo(
		() =>
			names.map( ( name ) => ( newValue ) => {
				const foundEnumValue = valuesEnum.find( ( enumValue ) =>
					findEnumValue( enumValue, newValue )
				);
				const mappedValue = foundEnumValue && mapEnumValue( foundEnumValue );

				setAttributes( {
					[ name ]: mappedValue ? mappedValue : undefined,
					[ `custom${ upperFirst( name ) }` ]: mappedValue ? undefined : newValue,
				} );
			} ),
		[ namesDep, valuesEnumDep, ...findAndMapEnumValueDeps ]
	);

	const mappedAttributes = useMemo(
		() =>
			names.map( ( name ) =>
				mapAttribute(
					attributes[ name ] || attributes[ `custom${ upperFirst( name ) }` ],
					name
				)
			),
		[
			namesDep,
			valuesEnumDep,
			useDeepCompareDep(
				names.map(
					( name ) => attributes[ name ] || attributes[ `custom${ upperFirst( name ) }` ]
				)
			),
			...mapAttributeDeps,
		]
	);

	const utils = useMemo(
		() =>
			Object.keys( utilsToBind ).reduce( ( utilsAccumulator, utilName ) => {
				utilsAccumulator[ utilName ] = utilsToBind[ utilName ].bind(
					null,
					valuesEnum
				);
				return utilsAccumulator;
			}, {} ),
		[ valuesEnumDep, useShallowCompareDep( utilsToBind ), ...utilsToBindDeps ]
	);

	return useMemo(
		() => ( {
			...names.reduce( ( attributePicker, name, i ) => {
				attributePicker[ `set${ upperFirst( name ) }` ] = setters[ i ];
				attributePicker[ name ] = mappedAttributes[ i ];
				return attributePicker;
			}, {} ),
			utils,
		} ),
		[ setters, mappedAttributes, utils ]
	);
}
