/**
 * Internal dependencies
 */
import core__query_pagination_numbers from '../../../test/integration/fixtures/blocks/core__query-pagination-numbers.serialized.html';

export default {
	title: 'Blocks/core__query_pagination_numbers',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__query_pagination_numbers,
			} }
		></div>
	);
};
