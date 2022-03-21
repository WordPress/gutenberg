/**
 * Internal dependencies
 */
import core__post_comment from '../../../test/integration/fixtures/blocks/core__post-comment.serialized.html';

export default {
	title: 'Blocks/core__post_comment',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_comment } }></div>
	);
};
