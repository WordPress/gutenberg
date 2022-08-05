/**
 * Internal dependencies
 */
import core__list_item from '../../../test/integration/fixtures/blocks/core__list-item.serialized.html';

export default {
	title: 'Blocks/core__list_item',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__list_item } }></div>;
};
