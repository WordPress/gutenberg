/**
 * Internal dependencies
 */
import core__post_author from '../../../test/integration/fixtures/blocks/core__post-author.serialized.html';

export default {
	title: 'Blocks/core__post_author',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_author } }></div>
	);
};
