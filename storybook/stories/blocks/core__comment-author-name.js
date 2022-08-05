/**
 * Internal dependencies
 */
import core__comment_author_name from '../../../test/integration/fixtures/blocks/core__comment-author-name.serialized.html';

export default {
	title: 'Blocks/core__comment_author_name',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comment_author_name } }
		></div>
	);
};
