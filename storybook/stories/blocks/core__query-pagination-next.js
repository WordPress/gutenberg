/**
 * Internal dependencies
 */
import core__query_pagination_next from '../../../test/integration/fixtures/blocks/core__query-pagination-next.serialized.html';

export default {
	title: 'Blocks/core__query_pagination_next',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__query_pagination_next } }
		></div>
	);
};
