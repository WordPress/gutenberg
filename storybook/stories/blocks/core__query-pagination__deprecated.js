/**
 * Internal dependencies
 */
import core__query_pagination__deprecated from '../../../test/integration/fixtures/blocks/core__query-pagination__deprecated.serialized.html';

export default {
	title: 'Blocks/core__query_pagination__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__query_pagination__deprecated,
			} }
		></div>
	);
};
