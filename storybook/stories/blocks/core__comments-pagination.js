/**
 * Internal dependencies
 */
import core__comments_pagination from '../../../test/integration/fixtures/blocks/core__comments-pagination.serialized.html';

export default {
	title: 'Blocks/core__comments_pagination',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__comments_pagination } }
		></div>
	);
};
