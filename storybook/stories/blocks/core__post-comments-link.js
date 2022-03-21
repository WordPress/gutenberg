/**
 * Internal dependencies
 */
import core__post_comments_link from '../../../test/integration/fixtures/blocks/core__post-comments-link.serialized.html';

export default {
	title: 'Blocks/core__post_comments_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_comments_link } }
		></div>
	);
};
