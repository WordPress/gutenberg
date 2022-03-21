/**
 * Internal dependencies
 */
import core__comment_content from '../../../test/integration/fixtures/blocks/core__comment-content.serialized.html';

export default {
	title: 'Blocks/core__comment_content',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comment_content } }
		></div>
	);
};
