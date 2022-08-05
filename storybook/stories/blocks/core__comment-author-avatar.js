/**
 * Internal dependencies
 */
import core__comment_author_avatar from '../../../test/integration/fixtures/blocks/core__comment-author-avatar.serialized.html';

export default {
	title: 'Blocks/core__comment_author_avatar',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comment_author_avatar } }
		></div>
	);
};
