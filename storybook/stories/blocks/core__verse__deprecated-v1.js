/**
 * Internal dependencies
 */
import core__verse__deprecated_v1 from '../../../test/integration/fixtures/blocks/core__verse__deprecated-v1.serialized.html';

export default {
	title: 'Blocks/core__verse__deprecated_v1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__verse__deprecated_v1 } }
		></div>
	);
};
