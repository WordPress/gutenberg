/**
 * Internal dependencies
 */
import core__latest_posts from '../../../test/integration/fixtures/blocks/core__latest-posts.serialized.html';

export default {
	title: 'Blocks/core__latest_posts',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__latest_posts } }></div>
	);
};
