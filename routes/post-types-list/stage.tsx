/**
 * WordPress dependencies
 */
import { Layout, PostTypesList } from '@wordpress/content-types';

/**
 * Internal dependencies
 */
import './style.scss';

function Stage() {
	return (
		<Layout activeTab="post-types">
			<PostTypesList />
		</Layout>
	);
}

export const stage = Stage;
