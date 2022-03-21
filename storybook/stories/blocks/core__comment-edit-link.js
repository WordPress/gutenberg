/**
 * Internal dependencies
 */
import core__comment_edit_link from '../../../test/integration/fixtures/blocks/core__comment-edit-link.serialized.html';

export default {
	title: 'Blocks/core__comment_edit_link',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comment_edit_link } }
		></div>
	);
};
