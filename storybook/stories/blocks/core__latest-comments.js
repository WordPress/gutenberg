/**
 * Internal dependencies
 */
import core__latest_comments from '../../../test/integration/fixtures/blocks/core__latest-comments.serialized.html';

export default {
	title: 'Blocks/core__latest_comments',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__latest_comments } }
		></div>
	);
};
