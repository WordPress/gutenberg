import { useContext, useMemo } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import type { SelectFunction } from '@wordpress/data';
import { store as richTextStore } from '../store';
import { FormatTypesContext } from '../contexts';
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
 * Selects the props that format types ask for to prepare a field's editable
 * tree, keyed by format names (`namespace/name`) so a caller can spread them
 * into the result of its own `useSelect`.
 *
 * @param select                       Select function.
 * @param formatTypes                  Format types to select props for.
 * @param allowedFormats               Allowed formats.
 * @param withoutInteractiveFormatting Whether to leave out interactive formats.
 * @param formatTypeHandlerContext     Context passed to format type methods.
 */
export function selectFormatTypeProps(
	select: SelectFunction,
	formatTypes: FormatType[],
	allowedFormats: readonly string[] | undefined,
	withoutInteractiveFormatting: boolean | undefined,
	formatTypeHandlerContext: object
) {
	const selected: Record< string, unknown > = {};
	for ( const type of formatTypes ) {
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
						formatTypeHandlerContext
					),
					type.name
				)
			);
		}
	}
	return selected;
}

/**
 * This hook provides RichText with the `formatTypes` and its derived props from
 * experimental format type settings.
 *
 * @param {Object}  options                                    Options
 * @param {Array}   options.allowedFormats                     Allowed formats
 * @param {boolean} options.withoutInteractiveFormatting       Whether to clean the interactive formatting or not.
 * @param {Object}  options.__unstableFormatTypeHandlerContext Context object passed to experimental format type methods.
 * @param {Object}  options.formatTypeProps                    Props selected with `selectFormatTypeProps`.
 */
export function useFormatTypes( {
	allowedFormats,
	withoutInteractiveFormatting,
	__unstableFormatTypeHandlerContext,
	formatTypeProps: keyedSelected = {},
}: {
	allowedFormats?: readonly string[];
	withoutInteractiveFormatting?: boolean;
	__unstableFormatTypeHandlerContext?: object;
	formatTypeProps?: Record< string, unknown >;
} ) {
	const registry = useRegistry();
	const offeredFormatTypes =
		useContext( FormatTypesContext ) ??
		registry.select( richTextStore ).getFormatTypes();
	const formatTypes = useMemo(
		() =>
			offeredFormatTypes.filter( ( type ) =>
				isFormatTypeAllowed(
					type,
					allowedFormats,
					withoutInteractiveFormatting
				)
			),
		[ offeredFormatTypes, allowedFormats, withoutInteractiveFormatting ]
	);
	const { dispatch } = registry;
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
