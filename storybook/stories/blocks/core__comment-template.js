/**
 * Internal dependencies
 */
import core__comment_template from '../../../test/integration/fixtures/blocks/core__comment-template.serialized.html';

export default {
	title: 'Blocks/core__comment_template',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comment_template } }
		></div>
	);
};
