/**
 * Internal dependencies
 */
import core__archives__showPostCounts from '../../../test/integration/fixtures/blocks/core__archives__showPostCounts.serialized.html';

export default {
	title: 'Blocks/core__archives__showPostCounts',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__archives__showPostCounts,
			} }
		></div>
	);
};
