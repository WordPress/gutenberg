/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as richTextStore } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { essentialFormatKey } from '../../store/private-keys';

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
 * @param {Object}  options                                Options
 * @param {string}  options.clientId                       Block client ID.
 * @param {string}  options.identifier                     Block attribute.
 * @param {Array}   options.allowedFormats                 Allowed formats
 * @param {boolean} options.withoutInteractiveFormatting   Whether to clean the interactive formatting or not.
 * @param {boolean} options.disableNoneEssentialFormatting Whether to disable none-essential formatting or not.
 */
export function useFormatTypes( {
	clientId,
	identifier,
	allowedFormats,
	withoutInteractiveFormatting,
	disableNoneEssentialFormatting = false,
} ) {
	const allFormatTypes = useSelect( formatTypesSelector, [] );
	const formatTypes = useMemo( () => {
		return allFormatTypes.filter(
			( {
				name,
				interactive,
				tagName,
				[ essentialFormatKey ]: isEssential,
			} ) => {
				if ( allowedFormats && ! allowedFormats.includes( name ) ) {
					return false;
				}

				if ( disableNoneEssentialFormatting && ! isEssential ) {
					return false;
				}

				if (
					withoutInteractiveFormatting &&
					( interactive || interactiveContentTags.has( tagName ) )
				) {
					return false;
				}

				return true;
			}
		);
	}, [
		allFormatTypes,
		allowedFormats,
		disableNoneEssentialFormatting,
		withoutInteractiveFormatting,
	] );
	const keyedSelected = useSelect(
		( select ) =>
			formatTypes.reduce( ( accumulator, type ) => {
				if ( ! type.__experimentalGetPropsForEditableTreePreparation ) {
					return accumulator;
				}

				return {
					...accumulator,
					...prefixSelectKeys(
						type.__experimentalGetPropsForEditableTreePreparation(
							select,
							{
								richTextIdentifier: identifier,
								blockClientId: clientId,
							}
						),
						type.name
					),
				};
			}, {} ),
		[ formatTypes, clientId, identifier ]
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
		if ( type.__experimentalCreatePrepareEditableTree ) {
			const handler = type.__experimentalCreatePrepareEditableTree(
				getPrefixedSelectKeys( keyedSelected, type.name ),
				{
					richTextIdentifier: identifier,
					blockClientId: clientId,
				}
			);

			if ( type.__experimentalCreateOnChangeEditableValue ) {
				valueHandlers.push( handler );
			} else {
				prepareHandlers.push( handler );
			}
		}

		if ( type.__experimentalCreateOnChangeEditableValue ) {
			let dispatchers = {};

			if ( type.__experimentalGetPropsForEditableTreeChangeHandler ) {
				dispatchers =
					type.__experimentalGetPropsForEditableTreeChangeHandler(
						dispatch,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);
			}

			const selected = getPrefixedSelectKeys( keyedSelected, type.name );
			changeHandlers.push(
				type.__experimentalCreateOnChangeEditableValue(
					{
						...( typeof selected === 'object' ? selected : {} ),
						...dispatchers,
					},
					{
						richTextIdentifier: identifier,
						blockClientId: clientId,
					}
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
