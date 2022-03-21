/**
 * Internal dependencies
 */
import core__query_title__deprecated_v1 from '../../../test/integration/fixtures/blocks/core__query-title__deprecated-v1.serialized.html';

export default {
	title: 'Blocks/core__query_title__deprecated_v1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__query_title__deprecated_v1,
			} }
		></div>
	);
};
