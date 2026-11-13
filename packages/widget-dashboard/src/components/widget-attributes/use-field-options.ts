import type { Field } from '@wordpress/dataviews';
import { useEffect, useState } from '@wordpress/element';
import type { WidgetAttributeValues } from '../../types';

type Options = NonNullable< Field< WidgetAttributeValues >[ 'elements' ] >;

/**
 * The fixed set of options a field offers, resolved once.
 *
 * Static `elements` return as they are. `getElements` is fetched here,
 * where it survives the presentation switching, so the select it feeds
 * mounts with its options instead of a loading spinner: the spinner would
 * take focus handed to the select, and its width would stand in for the
 * select's in the fit. Until the fetch settles there is nothing to offer.
 * A failed or empty fetch falls back to the static `elements`, as the
 * DataForm controls do.
 *
 * @param field The field, or `undefined` when no select applies.
 */
export function useFieldOptions(
	field: Field< WidgetAttributeValues > | undefined
): Options | undefined {
	const elements = field?.elements?.length ? field.elements : undefined;
	const getElements = field?.getElements;
	const [ fetched, setFetched ] = useState< {
		source: typeof getElements;
		options: Options | undefined;
	} >();

	useEffect( () => {
		if ( ! getElements ) {
			return;
		}

		let cancelled = false;
		getElements()
			.then( ( options ) => ( options?.length ? options : elements ) )
			.catch( () => elements )
			.then( ( options ) => {
				if ( ! cancelled ) {
					setFetched( { source: getElements, options } );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ getElements, elements ] );

	if ( ! getElements ) {
		return elements;
	}

	// A result fetched for a previous `getElements` does not apply.
	return fetched?.source === getElements ? fetched.options : undefined;
}
