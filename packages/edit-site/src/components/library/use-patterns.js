/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';

const TYPE = 'wp_template_part';

export default function usePattern() {
	const { records: allPatterns } = useEntityRecords( 'postType', TYPE, {
		per_page: -1,
	} );
	const patterns = useSelect(
		( select ) =>
			allPatterns?.filter(
				( pattern ) =>
					! select( coreStore ).isDeletingEntityRecord(
						'postType',
						TYPE,
						pattern.id
					)
			),
		[ allPatterns ]
	);

	// TODO: Add sorting etc.
	return patterns;
}
