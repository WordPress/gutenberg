/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as richTextStore } from '@wordpress/rich-text';

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

/**
 * This hook provides RichText with the `formatTypes` and its derived props from
 * experimental format type settings.
 *
 * @param {Object} $0                               Options
 * @param {string} $0.clientId                      Block client ID.
 * @param {string} $0.identifier                    Block attribute.
 * @param {boolean} $0.withoutInteractiveFormatting Whether to clean the interactive formattings or not.
 * @param {Array} $0.allowedFormats                 Allowed formats
 */
export function useFormatTypes( {
	clientId,
	identifier,
	withoutInteractiveFormatting,
	allowedFormats,
} ) {
	const allFormatTypes = useSelect( formatTypesSelector, [] );
	const formatTypes = useMemo( () => {
		return allFormatTypes.filter( ( { name, tagName } ) => {
			if ( allowedFormats && ! allowedFormats.includes( name ) ) {
				return false;
			}

			if (
				withoutInteractiveFormatting &&
				interactiveContentTags.has( tagName )
			) {
				return false;
			}

			return true;
		} );
	}, [ allFormatTypes, allowedFormats, interactiveContentTags ] );
	const keyedSelected = useSelect(
		( select ) =>
			formatTypes.reduce( ( accumulator, type ) => {
				if ( type.__experimentalGetPropsForEditableTreePreparation ) {
					accumulator[
						type.name
					] = type.__experimentalGetPropsForEditableTreePreparation(
						select,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);
				}

				return accumulator;
			}, {} ),
		[ formatTypes, clientId, identifier ]
	);
	const dispatch = useDispatch();
	const prepareHandlers = [];
	const valueHandlers = [];
	const changeHandlers = [];
	const dependencies = [];

	formatTypes.forEach( ( type ) => {
		if ( type.__experimentalCreatePrepareEditableTree ) {
			const selected = keyedSelected[ type.name ];
			const handler = type.__experimentalCreatePrepareEditableTree(
				selected,
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

			for ( const key in selected ) {
				dependencies.push( selected[ key ] );
			}
		}

		if ( type.__experimentalCreateOnChangeEditableValue ) {
			let dispatchers = {};

			if ( type.__experimentalGetPropsForEditableTreeChangeHandler ) {
				dispatchers = type.__experimentalGetPropsForEditableTreeChangeHandler(
					dispatch,
					{
						richTextIdentifier: identifier,
						blockClientId: clientId,
					}
				);
			}

			changeHandlers.push(
				type.__experimentalCreateOnChangeEditableValue(
					{
						...( keyedSelected[ type.name ] || {} ),
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
