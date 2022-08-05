/**
 * Internal dependencies
 */
import core__query_pagination_previous from '../../../test/integration/fixtures/blocks/core__query-pagination-previous.serialized.html';

export default {
	title: 'Blocks/core__query_pagination_previous',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__query_pagination_previous,
			} }
		></div>
	);
};
