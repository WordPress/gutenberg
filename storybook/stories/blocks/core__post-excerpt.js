/**
 * Internal dependencies
 */
import core__post_excerpt from '../../../test/integration/fixtures/blocks/core__post-excerpt.serialized.html';

export default {
	title: 'Blocks/core__post_excerpt',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_excerpt } }></div>
	);
};
