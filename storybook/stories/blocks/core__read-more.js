/**
 * Internal dependencies
 */
import core__read_more from '../../../test/integration/fixtures/blocks/core__read-more.serialized.html';

export default {
	title: 'Blocks/core__read_more',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__read_more } }></div>;
};
