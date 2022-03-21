/**
 * Internal dependencies
 */
import core__comments_pagination_next from '../../../test/integration/fixtures/blocks/core__comments-pagination-next.serialized.html';

export default {
	title: 'Blocks/core__comments_pagination_next',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__comments_pagination_next,
			} }
		></div>
	);
};
