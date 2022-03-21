/**
 * Internal dependencies
 */
import core__post_title from '../../../test/integration/fixtures/blocks/core__post-title.serialized.html';

export default {
	title: 'Blocks/core__post_title',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__post_title } }></div>;
};
