/**
 * Internal dependencies
 */
import core__post_comments from '../../../test/integration/fixtures/blocks/core__post-comments.serialized.html';

export default {
	title: 'Blocks/core__post_comments',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_comments } }></div>
	);
};
