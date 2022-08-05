/**
 * Internal dependencies
 */
import core__post_author_name from '../../../test/integration/fixtures/blocks/core__post-author-name.serialized.html';

export default {
	title: 'Blocks/core__post_author_name',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_author_name } }
		></div>
	);
};
