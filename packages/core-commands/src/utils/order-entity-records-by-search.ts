import type { SearchableEntityRecord } from '../types';

export function orderEntityRecordsBySearch< T extends SearchableEntityRecord >(
	records: T[] | null = [],
	search = ''
) {
	if ( ! Array.isArray( records ) || ! records.length ) {
		return [];
	}

	if ( ! search ) {
		return records;
	}

	const priority: T[] = [];
	const nonPriority: T[] = [];

	for ( let i = 0; i < records.length; i++ ) {
		const record = records[ i ];
		if (
			record?.title?.raw?.toLowerCase()?.includes( search?.toLowerCase() )
		) {
			priority.push( record );
		} else {
			nonPriority.push( record );
		}
	}

	return priority.concat( nonPriority );
}
