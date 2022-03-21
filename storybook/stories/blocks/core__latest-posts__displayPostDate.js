/**
 * Internal dependencies
 */
import core__latest_posts__displayPostDate from '../../../test/integration/fixtures/blocks/core__latest-posts__displayPostDate.serialized.html';

export default {
	title: 'Blocks/core__latest_posts__displayPostDate',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__latest_posts__displayPostDate,
			} }
		></div>
	);
};
