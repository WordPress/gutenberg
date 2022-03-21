/**
 * Internal dependencies
 */
import core__search from '../../../test/integration/fixtures/blocks/core__search.serialized.html';

export default {
	title: 'Blocks/core__search',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__search } }></div>;
};
