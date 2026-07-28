/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as richTextStore } from '../store';

function formatTypesSelector( select ) {
	return select( richTextStore ).getFormatTypes();
}

/**
 * Set of all interactive content tags.
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#interactive-content
 */
const interactiveContentTags = new Set( [
	'a',
	'audio',
	'button',
	'details',
	'embed',
	'iframe',
	'input',
	'label',
	'select',
	'textarea',
	'video',
] );

function prefixSelectKeys( selected, prefix ) {
	if ( typeof selected !== 'object' ) {
		return { [ prefix ]: selected };
	}
	return Object.fromEntries(
		Object.entries( selected ).map( ( [ key, value ] ) => [
			`${ prefix }.${ key }`,
			value,
		] )
	);
}

function getPrefixedSelectKeys( selected, prefix ) {
	if ( selected[ prefix ] ) {
		return selected[ prefix ];
	}
	return Object.keys( selected )
		.filter( ( key ) => key.startsWith( prefix + '.' ) )
		.reduce( ( accumulator, key ) => {
			accumulator[ key.slice( prefix.length + 1 ) ] = selected[ key ];
			return accumulator;
		}, {} );
}

/**
 * This hook provides RichText with the `formatTypes` and its derived props from
 * experimental format type settings.
 *
 * @param {Object}  options                                    Options
 * @param {Array}   options.allowedFormats                     Allowed formats
 * @param {boolean} options.withoutInteractiveFormatting       Whether to clean the interactive formatting or not.
 * @param {Object}  options.__unstableFormatTypeHandlerContext Context object passed to experimental format type methods.
 */
export function useFormatTypes( {
	allowedFormats,
	withoutInteractiveFormatting,
	__unstableFormatTypeHandlerContext,
} ) {
	const allFormatTypes = useSelect( formatTypesSelector, [] );
	const formatTypes = useMemo( () => {
		return allFormatTypes.filter( ( { name, interactive, tagName } ) => {
			if ( allowedFormats && ! allowedFormats.includes( name ) ) {
				return false;
			}

			if (
				withoutInteractiveFormatting &&
				( interactive || interactiveContentTags.has( tagName ) )
			) {
				return false;
			}

			return true;
		} );
	}, [ allFormatTypes, allowedFormats, withoutInteractiveFormatting ] );
	const keyedSelected = useSelect(
		( select ) =>
			formatTypes.reduce( ( accumulator, type ) => {
				if (
					! type.__experimentalGetPropsForEditableTreePreparation ||
					! __unstableFormatTypeHandlerContext
				) {
					return accumulator;
				}

				return {
					...accumulator,
					...prefixSelectKeys(
						type.__experimentalGetPropsForEditableTreePreparation(
							select,
							__unstableFormatTypeHandlerContext
						),
						type.name
					),
				};
			}, {} ),
		[ formatTypes, __unstableFormatTypeHandlerContext ]
	);
	const dispatch = useDispatch();
	const prepareHandlers = [];
	const valueHandlers = [];
	const changeHandlers = [];
	const dependencies = [];

	for ( const key in keyedSelected ) {
		dependencies.push( keyedSelected[ key ] );
	}

	formatTypes.forEach( ( type ) => {
		if (
			type.__experimentalCreatePrepareEditableTree &&
			__unstableFormatTypeHandlerContext
		) {
			const handler = type.__experimentalCreatePrepareEditableTree(
				getPrefixedSelectKeys( keyedSelected, type.name ),
				__unstableFormatTypeHandlerContext
			);

			if ( type.__experimentalCreateOnChangeEditableValue ) {
				valueHandlers.push( handler );
			} else {
				prepareHandlers.push( handler );
			}
		}

		if (
			type.__experimentalCreateOnChangeEditableValue &&
			__unstableFormatTypeHandlerContext
		) {
			let dispatchers = {};

			if ( type.__experimentalGetPropsForEditableTreeChangeHandler ) {
				dispatchers =
					type.__experimentalGetPropsForEditableTreeChangeHandler(
						dispatch,
						__unstableFormatTypeHandlerContext
					);
			}

			const selected = getPrefixedSelectKeys( keyedSelected, type.name );
			changeHandlers.push(
				type.__experimentalCreateOnChangeEditableValue(
					{
						...( typeof selected === 'object' ? selected : {} ),
						...dispatchers,
					},
					__unstableFormatTypeHandlerContext
				)
			);
		}
	} );

	return {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	};
}
