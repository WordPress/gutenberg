/**
 * Internal dependencies
 */
import core__query_pagination from '../../../test/integration/fixtures/blocks/core__query-pagination.serialized.html';

export default {
	title: 'Blocks/core__query_pagination',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__query_pagination } }
		></div>
	);
};
