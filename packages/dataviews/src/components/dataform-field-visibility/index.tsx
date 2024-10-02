/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../types';

type DataFormFieldVisibilityProps< Item > = React.PropsWithChildren< {
	field: NormalizedField< Item >;
	data: Item;
} >;

export default function DataFormFieldVisibility< Item >( {
	data,
	field,
	children,
}: DataFormFieldVisibilityProps< Item > ) {
	const dependencies = field.dependencies
		? field.dependencies.map( ( dep ) => data[ dep ] )
		: [ field?.getValue( { item: data } ) ];
	const isVisible = useMemo( () => {
		if ( field.isVisible ) {
			return field.isVisible( data );
		}
		return true;
	}, [ field.isVisible, ...dependencies ] );

	if ( ! isVisible ) {
		return null;
	}
	return children;
}
