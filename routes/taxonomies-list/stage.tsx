/**
 * WordPress dependencies
 */
import { Layout, TaxonomiesList } from '@wordpress/content-types';

/**
 * Internal dependencies
 */
import './style.scss';

function Stage() {
	return (
		<Layout activeTab="taxonomies">
			<TaxonomiesList />
		</Layout>
	);
}

export const stage = Stage;
