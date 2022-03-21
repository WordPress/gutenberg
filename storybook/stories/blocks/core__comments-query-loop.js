/**
 * Internal dependencies
 */
import core__comments_query_loop from '../../../test/integration/fixtures/blocks/core__comments-query-loop.serialized.html';

export default {
	title: 'Blocks/core__comments_query_loop',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comments_query_loop } }
		></div>
	);
};
