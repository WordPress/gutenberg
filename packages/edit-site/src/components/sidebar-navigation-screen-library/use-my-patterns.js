/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export default function useMyPatterns() {
	const myPatterns = useSelect( ( select ) =>
		select( coreStore ).getEntityRecords( 'postType', 'wp_block', {
			per_page: -1,
		} )
	);

	return {
		myPatterns: {
			count: myPatterns?.length || 0,
			name: 'my-patterns',
			label: __( 'My patterns' ),
		},
		hasPatterns: !! myPatterns?.length,
	};
}
