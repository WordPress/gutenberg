/**
 * Internal dependencies
 */
import core__comments_pagination_previous from '../../../test/integration/fixtures/blocks/core__comments-pagination-previous.serialized.html';

export default {
	title: 'Blocks/core__comments_pagination_previous',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__comments_pagination_previous,
			} }
		></div>
	);
};
