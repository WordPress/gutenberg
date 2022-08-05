/**
 * Internal dependencies
 */
import core__post_content from '../../../test/integration/fixtures/blocks/core__post-content.serialized.html';

export default {
	title: 'Blocks/core__post_content',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_content } }></div>
	);
};
