/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

export default function useTemplates() {
	const templates = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'wp_template', {
				status: [ 'publish', 'auto-draft' ],
				per_page: -1,
			} ),
		[]
	);

	return templates || [];
}
