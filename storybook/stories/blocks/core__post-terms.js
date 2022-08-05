/**
 * Internal dependencies
 */
import core__post_terms from '../../../test/integration/fixtures/blocks/core__post-terms.serialized.html';

export default {
	title: 'Blocks/core__post_terms',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__post_terms } }></div>;
};
