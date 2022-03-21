/**
 * Internal dependencies
 */
import core__comment_date from '../../../test/integration/fixtures/blocks/core__comment-date.serialized.html';

export default {
	title: 'Blocks/core__comment_date',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__comment_date } }></div>
	);
};
