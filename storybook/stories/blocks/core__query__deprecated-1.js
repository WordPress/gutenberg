/**
 * Internal dependencies
 */
import core__query__deprecated_1 from '../../../test/integration/fixtures/blocks/core__query__deprecated-1.serialized.html';

export default {
	title: 'Blocks/core__query__deprecated_1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__query__deprecated_1 } }
		></div>
	);
};
