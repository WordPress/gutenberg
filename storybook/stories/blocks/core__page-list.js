/**
 * Internal dependencies
 */
import core__page_list from '../../../test/integration/fixtures/blocks/core__page-list.serialized.html';

export default {
	title: 'Blocks/core__page_list',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__page_list } }></div>;
};
