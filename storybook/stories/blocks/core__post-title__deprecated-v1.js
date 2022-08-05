/**
 * Internal dependencies
 */
import core__post_title__deprecated_v1 from '../../../test/integration/fixtures/blocks/core__post-title__deprecated-v1.serialized.html';

export default {
	title: 'Blocks/core__post_title__deprecated_v1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__post_title__deprecated_v1,
			} }
		></div>
	);
};
