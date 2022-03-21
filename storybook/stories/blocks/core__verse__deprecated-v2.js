/**
 * Internal dependencies
 */
import core__verse__deprecated_v2 from '../../../test/integration/fixtures/blocks/core__verse__deprecated-v2.serialized.html';

export default {
	title: 'Blocks/core__verse__deprecated_v2',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__verse__deprecated_v2 } }
		></div>
	);
};
