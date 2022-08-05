/**
 * Internal dependencies
 */
import core__post_author_biography from '../../../test/integration/fixtures/blocks/core__post-author-biography.serialized.html';

export default {
	title: 'Blocks/core__post_author_biography',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__post_author_biography } }
		></div>
	);
};
