/**
 * Internal dependencies
 */
import type { NormalizedField } from '../../../types';

export default function getDataByGroup< Item >(
	data: any[],
	groupByField: NormalizedField< Item >
): Map< string, any[] > {
	return data.reduce( ( groups: Map< string, typeof data >, item ) => {
		const groupName = groupByField.getValue( { item } );
		if ( ! groups.has( groupName ) ) {
			groups.set( groupName, [] );
		}
		groups.get( groupName )?.push( item );
		return groups;
	}, new Map< string, typeof data >() );
}
