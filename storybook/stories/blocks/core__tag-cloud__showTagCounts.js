/**
 * Internal dependencies
 */
import core__tag_cloud__showTagCounts from '../../../test/integration/fixtures/blocks/core__tag-cloud__showTagCounts.serialized.html';

export default {
	title: 'Blocks/core__tag_cloud__showTagCounts',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__tag_cloud__showTagCounts,
			} }
		></div>
	);
};
