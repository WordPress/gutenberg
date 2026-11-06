import { useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as richTextStore } from '../store';
import type { FormatType, RichTextFormatList } from '../types';

/**
 * Format handlers derived from the editable tree and passed to `useRichText`.
 */
type FormatHandler = (
	formats: RichTextFormatList[],
	text: string
) => RichTextFormatList[];

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

// The key the format types are selected under, next to the props selected
// for each format type, which are keyed by format names (`namespace/name`).
const FORMAT_TYPES_KEY = 'formatTypes';

function isFormatTypeAllowed(
	{ name, interactive, tagName }: FormatType,
	allowedFormats: readonly string[] | undefined,
	withoutInteractiveFormatting: boolean | undefined
) {
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
}

function prefixSelectKeys( selected: unknown, prefix: string ) {
	if ( typeof selected !== 'object' || selected === null ) {
		return { [ prefix ]: selected };
	}
	return Object.fromEntries(
		Object.entries( selected ).map( ( [ key, value ] ) => [
			`${ prefix }.${ key }`,
			value,
		] )
	);
}

function getPrefixedSelectKeys(
	selected: Record< string, unknown >,
	prefix: string
) {
	if ( selected[ prefix ] ) {
		return selected[ prefix ];
	}
	return Object.keys( selected )
		.filter( ( key ) => key.startsWith( prefix + '.' ) )
		.reduce( ( accumulator: Record< string, unknown >, key ) => {
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
}: {
	allowedFormats?: readonly string[];
	withoutInteractiveFormatting?: boolean;
	__unstableFormatTypeHandlerContext?: object;
} ) {
	// One subscription for the format types and the props some of them
	// select: each mounted subscription costs every field.
	const { [ FORMAT_TYPES_KEY ]: allFormatTypes, ...keyedSelected } =
		useSelect(
			( select ) => {
				const selected: Record< string, unknown > = {
					[ FORMAT_TYPES_KEY ]:
						select( richTextStore ).getFormatTypes(),
				};

				if ( ! __unstableFormatTypeHandlerContext ) {
					return selected;
				}

				for ( const type of selected[
					FORMAT_TYPES_KEY
				] as FormatType[] ) {
					if (
						type.__experimentalGetPropsForEditableTreePreparation &&
						isFormatTypeAllowed(
							type,
							allowedFormats,
							withoutInteractiveFormatting
						)
					) {
						Object.assign(
							selected,
							prefixSelectKeys(
								type.__experimentalGetPropsForEditableTreePreparation(
									select,
									__unstableFormatTypeHandlerContext
								),
								type.name
							)
						);
					}
				}

				return selected;
			},
			[
				allowedFormats,
				withoutInteractiveFormatting,
				__unstableFormatTypeHandlerContext,
			]
		);
	const formatTypes = useMemo(
		() =>
			( allFormatTypes as FormatType[] ).filter( ( type ) =>
				isFormatTypeAllowed(
					type,
					allowedFormats,
					withoutInteractiveFormatting
				)
			),
		[ allFormatTypes, allowedFormats, withoutInteractiveFormatting ]
	);
	const dispatch = useDispatch();
	const prepareHandlers: FormatHandler[] = [];
	const valueHandlers: FormatHandler[] = [];
	const changeHandlers: ( (
		formats: RichTextFormatList[],
		text: string
	) => void )[] = [];
	const dependencies: unknown[] = [];

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
			let dispatchers: object = {};

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
