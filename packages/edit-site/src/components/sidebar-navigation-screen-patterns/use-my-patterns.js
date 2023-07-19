/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function useMyPatterns() {
	const myPatternsCount = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', 'wp_block', {
				per_page: -1,
			} )?.length ?? 0
	);

	return {
		myPatterns: {
			count: myPatternsCount,
			name: 'my-patterns',
			label: __( 'My patterns' ),
		},
		hasPatterns: myPatternsCount > 0,
	};
}
