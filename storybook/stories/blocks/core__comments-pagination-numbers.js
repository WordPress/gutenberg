/**
 * Internal dependencies
 */
import core__comments_pagination_numbers from '../../../test/integration/fixtures/blocks/core__comments-pagination-numbers.serialized.html';

export default {
	title: 'Blocks/core__comments_pagination_numbers',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__comments_pagination_numbers,
			} }
		></div>
	);
};
