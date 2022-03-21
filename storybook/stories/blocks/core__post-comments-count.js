/**
 * Internal dependencies
 */
import core__post_comments_count from '../../../test/integration/fixtures/blocks/core__post-comments-count.serialized.html';

export default {
	title: 'Blocks/core__post_comments_count',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_comments_count } }
		></div>
	);
};
