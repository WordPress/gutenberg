/**
 * Internal dependencies
 */
import core__post_comments_form from '../../../test/integration/fixtures/blocks/core__post-comments-form.serialized.html';

export default {
	title: 'Blocks/core__post_comments_form',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_comments_form } }
		></div>
	);
};
