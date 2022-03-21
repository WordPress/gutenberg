/**
 * Internal dependencies
 */
import core__comment_author_name__deprecated_v1 from '../../../test/integration/fixtures/blocks/core__comment-author-name__deprecated-v1.serialized.html';

export default {
	title: 'Blocks/core__comment_author_name__deprecated_v1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__comment_author_name__deprecated_v1,
			} }
		></div>
	);
};
